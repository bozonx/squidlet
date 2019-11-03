import Timeout = NodeJS.Timeout;

import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';
import IndexedEventEmitter from './IndexedEventEmitter';
import Promised from './Promised';


type QueuedCb = () => Promise<void>;
type StartJobHandler = (jobId: JobId) => void;
type EndJobHandler = (error: string | undefined, jobId: JobId) => void;
type JobId = string;
// array like [JobId, QueuedCb, isCanceled]
type Job = [JobId, QueuedCb, Promised<void>, boolean];

enum JobPositions {
  id,
  cb,
  pendingPromised,
  // TODO: может убрать
  canceled,
}
enum QueueEvents {
  // the new job has been just started
  startJob,
  // job just finished with error or not but the next job isn't started at the moment.
  endJob,
}

let unnamedJobIdCounter = -1;


/**
 * Put callback to queue.
 * Callbacks with the same id will be make delayed.
 * Delayed cb will be called only once. The new delayed cb just will replace delayed cb to a new one.
 * Please don't use only numbers like "0" as an id. Use any other string as an id.
 */
export default class RequestQueue {
  private readonly jobTimeoutSec: number;
  // TODO: может если сделать обертку для промиса то можно там делать reject а не писать в лог
  private readonly logError: (msg: string) => void;
  private readonly events = new IndexedEventEmitter();
  private queue: Job[] = [];
  private currentJob?: Job;
  // timeout of currentJob
  private runningTimeout?: Timeout;


  constructor(logError: (msg: string) => void, jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.logError = logError;
    this.jobTimeoutSec = jobTimeoutSec;
  }

  // TODO: test
  destroy() {
    this.events.destroy();

    // TODO: review - не нужно
    if (this.currentJob) this.cancelCurrentJob(this.currentJob[JobPositions.id]);

    delete this.queue;
    // TODO: just delete
    this.finalizeCurrentJob();
  }


  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get ids of jobs include current job.
   */
  getJobIds(): string[] {
    const queuedIds: string[] = this.getQueuedJobsId();

    if (this.currentJob) {
      return [this.currentJob[JobPositions.id], ...queuedIds];
    }

    return queuedIds;
  }

  // TODO: test
  /**
   * Is something in progress
   */
  isInProgress(): boolean {
    return Boolean(this.currentJob);
  }

  isJobInProgress(jobId: JobId): boolean {
    return this.getCurrentJobId() === jobId;
  }

  /**
   * Returns id of current job of undefined
   */
  getCurrentJobId(): JobId | undefined {
    if (!this.currentJob) return;

    return this.currentJob[JobPositions.id];
  }

  /**
   * Check if queue has job with specified jobId even it it is a current job.
   */
  hasJob(jobId: JobId): boolean {
    return this.getJobIds().includes(jobId);
  }

  /**
   * Cancel job with uniq id. It can be current or wait in the queue
   */
  cancelJob(jobId: JobId) {
    this.cancelCurrentJob(jobId);
    this.removeJobFromQueue(jobId);
    this.startNextJobIfNeed();
  }

  /**
   * Return the promise which will be fulfilled when the current job is finished.
   */
  async waitCurrentJobFinished(): Promise<void> {
    if (!this.currentJob) return;

    return this.getWaitJobPromise(QueueEvents.endJob, this.currentJob[JobPositions.id]);
  }

  /**
   * Return the promise which will be fulfilled before the job is get started.
   * You should check that the queue has this job by calling `hasJob(jobId)`.
   */
  waitJobStart(jobId: JobId): Promise<void> {
    if (this.isJobInProgress(jobId)) return Promise.resolve();

    if (!this.hasJob(jobId)) {
      return Promise.reject(`RequestQueue.waitJobFinished: There isn't any job "${jobId}"`);
    }

    return new Promise<void>((resolve) => {
      const handlerIndex = this.events.addListener(QueueEvents.startJob, (startedJobId: JobId) => {
        if (startedJobId !== jobId) return;

        this.events.removeListener(handlerIndex, QueueEvents.startJob);
        resolve();
      });

      // TODO: а если не запустится - нужен наверное таймаут ???
      // TODO: могут отменить
    });
  }

  /**
   * Return the promise which will be fulfilled when the job is finished.
   * You should check that the queue has this job by calling `hasJob(jobId)`.
   * WARNING! If you use it to wait for job finished and the next job started you should not to use async
   * functions and return from your function exactly this promise otherwise it will be fulfilled
   * not exactly at time when job actually get finished.
   */
  waitJobFinished(jobId: JobId): Promise<void> {
    if (!this.hasJob(jobId)) {
      return Promise.reject(`RequestQueue.waitJobFinished: There isn't any job "${jobId}"`);
    }

    return this.getWaitJobPromise(QueueEvents.endJob, jobId);
  }

  onJobStart(cb: StartJobHandler): number {
    return this.events.addListener(QueueEvents.startJob, cb);
  }

  onJobEnd(cb: EndJobHandler): number {
    return this.events.addListener(QueueEvents.endJob, cb);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }

  /**
   * Add job to queue.
   * If job with the same jobId is in progress the new cb will be refused
   * If the id and current job's are different - the job will be added to the end of queue.
   * If there is a job with the same is in queue - the cb in queue will be replaced to a new one.
   * @param cb - callback which will be called when job starts
   * @param jobId - specify if of job to avoid the duplicates. It not set then it will be generated.
   * @return jobId which is specified of generated if isn't specified
   */
  add(cb: QueuedCb, jobId?: JobId): JobId {
    const resolvedId: JobId = this.resolveJobId(jobId);
    // The job with specified id is running
    // do noting - don't update the current job and don't add job to queue
    if (this.currentJob && this.currentJob[JobPositions.id] === resolvedId) {
      return resolvedId;
    }
    // else job is not running
    // get job index in the queue
    const jobIndex: number = this.getJobIndex(resolvedId);
    // check that job is in the queue
    if (jobIndex >= 0) {
      // if the job in a queue - update cb in this job
      this.queue[jobIndex][JobPositions.cb] = cb;
    }
    else {
      // not in a queue - add a new job to queue
      this.queue.push([resolvedId, cb, new Promised<void>(), false]);
      this.startNextJobIfNeed();
    }

    return resolvedId;
  }


  /**
   * Start a new job if there isn't a current job and queue has some jobs.
   * It doesn't start a new job while current is in progress.
   */
  private startNextJobIfNeed = () => {
    // do nothing if there is current job or no one in queue
    if (this.currentJob || !this.queue.length) return;
    // move queue's first job to the current
    this.currentJob = this.queue[0];
    // remove the first element from queue
    this.queue.shift();
    this.startJob(this.currentJob);
  }

  /**
   * Start job. It should be current job.
   */
  private startJob(job: Job) {
    this.events.emit(QueueEvents.startJob, job[JobPositions.id]);
    // start timeout of current job
    this.runningTimeout = setTimeout(
      () => {
        // mark as canceled to get not called handlers after cb finished
        job[JobPositions.canceled] = true;

        this.handleCbFinished(
          new Error(`RequestQueue: Timeout of job "${job[JobPositions.id]}" has been exceeded`),
          job
        );
      },
      this.jobTimeoutSec * 1000
    );
    // start cb
    this.callCb(job[JobPositions.cb])
      .then(() => {
        if (!job[JobPositions.canceled]) this.handleCbFinished(undefined, job);
      })
      .catch((e: Error) => {
        if (!job[JobPositions.canceled]) this.handleCbFinished(e, job);
      });
  }

  private handleCbFinished(err: Error | undefined, job: Job) {
    if (!this.currentJob) {
      throw new Error(`RequestQueue: No current job when the job finished`);
    }
    else if (this.currentJob[JobPositions.id] !== job[JobPositions.id]) {
      throw new Error(`RequestQueue: Current job id doesn't match with the finished job id`);
    }

    // delete timeout and current job
    this.finalizeCurrentJob();

    // rise "end" event between current job finished and starting a new job
    this.events.emit(QueueEvents.endJob, err, job[JobPositions.id]);
    this.startNextJobIfNeed();
  }

  private finalizeCurrentJob() {
    if (this.runningTimeout) clearTimeout(this.runningTimeout);

    delete this.runningTimeout;
    // delete finished job
    delete this.currentJob;
  }

  private cancelCurrentJob(jobId: string) {
    if (!this.currentJob || this.currentJob[JobPositions.id] !== jobId) return;

    this.currentJob[JobPositions.canceled] = true;
    // delete timeout and current job
    this.finalizeCurrentJob();
    this.events.emit(QueueEvents.endJob, undefined, jobId);
  }

  // TODO: review
  private getWaitJobPromise(eventName: QueueEvents, jobId: JobId): Promise<void> {
    if (typeof jobId !== 'string') {
      throw new Error(`RequestQueue.getWaitJobPromise: JobId has to be a string`);
    }

    return new Promise<void>((resolve, reject) => {
      let handlerIndex: number;

      const cb = (error: string | undefined, finishedJobId: JobId) => {
        if (finishedJobId !== jobId) return;

        events.removeListener(handlerIndex);

        if (error) return reject(error);

        resolve();
      };

      handlerIndex = events.addListener(cb);
    });
  }

  /**
   * remove job or delayed job in queue
   */
  private removeJobFromQueue(jobId: JobId) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) return;
    this.queue.splice(jobIndex, 1);
  }

  /**
   * Find index of job or return -1 if it hasn't been found
   */
  private getJobIndex(jobId: JobId): number {
    return this.queue.findIndex((item: Job) => item[JobPositions.id] === jobId);
  }

  private getQueuedJobsId(): string[] {
    return this.queue.map((item: Job) => item[JobPositions.id]);
  }

  /**
   * It uses passed jobId or generate a new one
   */
  private resolveJobId(jobId: JobId | undefined): JobId {
    if (typeof jobId === 'string') return jobId;

    unnamedJobIdCounter++;

    return String(unnamedJobIdCounter);
  }

  private async callCb(cb: QueuedCb) {
    await cb();
  }

}
