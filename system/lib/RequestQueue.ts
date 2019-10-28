import IndexedEvents from './IndexedEvents';


/**
 * Mode default (useful for read requests):
 * * don't add to queue cb with the same id as current job.
 * * If there isn't a job with the same id the new job will be added to the end of queue
 * * If there is job with the same id in the queue the cb will be replaced to the new one
 * Mode recall (useful for write requests):
 * * if job with the same id is running - it will call a new delayed job straight after current cb.
 * * New cb will replace delayed cb
 * * If there isn't a job with the same id the new job will be added to the end of queue
 * * If there is job with the same id in the queue the cb will be replaced to the new one
 * * If the current job will failed then delayed cb won't be called, the next job in queue will be started
 */
export type Mode = 'default' | 'recall';

type RequestCb = () => Promise<void>;
type StartJobHandler = (jobId: JobId) => void;
type EndJobHandler = (error: string | undefined, jobId: JobId) => void;
type JobId = string;
// array like [JobId, RequestCb, node, isCanceled, recallCb]
type Job = [JobId, RequestCb, Mode, boolean, RequestCb?];

enum JobPositions {
  id,
  cb,
  mode,
  canceled,
  recall,
}
const DEFAULT_JOB_TIMEOUT_SEC = 120;
let unnamedJobIdCounter = -1;


/**
 * Put callback to queue.
 * Callbacks with the same id will be make delayed.
 * Delayed cb will be called only once. The new delayed cb just will replace delayed cb to a new one.
 * Please don't use only numbers like "0" as an id. Use any other string as an id.
 */
export default class RequestQueue {
  private readonly jobTimeoutSec: number;
  private readonly logError: (msg: string) => void;
  private readonly startJobEvents = new IndexedEvents<StartJobHandler>();
  private readonly endJobEvents = new IndexedEvents<EndJobHandler>();
  private queue: Job[] = [];
  private currentJob?: Job;
  private runningTimeout?: any;


  constructor(logError: (msg: string) => void, jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.logError = logError;
    this.jobTimeoutSec = jobTimeoutSec;
  }

  // TODO: test
  destroy() {
    this.startJobEvents.destroy();
    this.endJobEvents.destroy();

    if (this.currentJob) this.cancelCurrentJob(this.currentJob[JobPositions.id]);

    delete this.queue;

    this.finalizeCurrentJob();
  }


  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get ids of jobs include current job.
   */
  getJobIds(): string[] {
    const queued = this.getQueuedJobs();

    if (this.currentJob) {
      return [this.currentJob[JobPositions.id], ...queued];
    }

    return queued;
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

  jobHasRecallCb(jobId: JobId): boolean {
    if (this.currentJob && this.currentJob[JobPositions.id] === jobId) {
      return Boolean(this.currentJob[JobPositions.recall]);
    }

    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) return false;

    return Boolean(this.queue[jobIndex][JobPositions.recall]);
  }

  /**
   * Cancel current and delayed job with uniq id.
   */
  cancelJob(jobId: JobId) {
    this.cancelCurrentJob(jobId);
    this.removeJobFromQueue(jobId);
    this.startNextJob();
  }

  /**
   * Return the promise which will be fulfilled when the current job is finished.
   */
  async waitCurrentJobFinished(): Promise<void> {
    if (!this.currentJob) return;

    return this.getWaitJobPromise(this.endJobEvents, this.currentJob[JobPositions.id]);
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
      const handlerIndex = this.startJobEvents.addListener((startedJobId: JobId) => {
        if (startedJobId !== jobId) return;

        this.startJobEvents.removeListener(handlerIndex);
        resolve();
      });
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

    return this.getWaitJobPromise(this.endJobEvents, jobId);
  }

  onJobStart(cb: StartJobHandler): number {
    return this.startJobEvents.addListener(cb);
  }

  onJobEnd(cb: EndJobHandler): number {
    return this.endJobEvents.addListener(cb);
  }

  removeStartJobListener(handlerIndex: number) {
    this.startJobEvents.removeListener(handlerIndex);
  }

  removeEndJobListener(handlerIndex: number) {
    this.endJobEvents.removeListener(handlerIndex);
  }

  /**
   * Add job to queue.
   * If job with the same jobId is in progress it will refused in default mode
   * or set as a recall cb in recall mode.
   * It id is different with the current - the job will be add to the end of queue.
   * It there is a job with the same is in queue - the cb in queue will be replaced to a new one.
   */
  request(jobId: JobId | undefined, cb: RequestCb, mode: Mode = 'default'): JobId {
    const resolvedId: JobId = this.resolveJobId(jobId);

    // if the job is running
    if (this.currentJob && this.currentJob[JobPositions.id] === resolvedId) {
      // set or replace recall cb in recall mode
      if (mode === 'recall') this.currentJob[JobPositions.recall] = cb;

      // in default mode do noting - don't update the current job and don't add job to queue
      return resolvedId;
    }

    const jobIndex: number = this.getJobIndex(resolvedId);

    // if the job in a queue - update queued job
    if (jobIndex >= 0) {
      this.queue[jobIndex][JobPositions.cb] = cb;
      this.queue[jobIndex][JobPositions.mode] = mode;
    }
    // add a new job to queue
    else {
      // add a new job
      this.queue.push([resolvedId, cb, mode, false]);
      this.startNextJob();
    }

    return resolvedId;
  }


  /**
   * Start a new job if there isn't a current job and queue has some jobs.
   * It doesn't start a new job while current is in progress.
   */
  private startNextJob = () => {
    // do nothing if there is current job or no one in queue
    if (this.currentJob || !this.queue.length) return;

    // set first job in queue as current
    this.currentJob = this.queue[0];

    // remove the first element from queue
    this.queue.shift();

    this.startCurrentJob();
  }

  private startCurrentJob() {
    // start job on next tick
    setTimeout(() => {
      if (!this.currentJob) throw new Error(`RequestQueue.startCurrentJob: no currentJob`);

      const job: Job = this.currentJob;

      this.startJobEvents.emit(job[JobPositions.id]);

      this.runningTimeout = setTimeout(
        () => this.handleTimeoutOfJob(job),
        this.jobTimeoutSec * 1000
      );

      // start cb
      try {
        job[JobPositions.cb]()
          .then(() => this.handleCbFinished(undefined, job))
          .catch((e: Error) => this.handleCbFinished(String(e), job));
      }
      catch (err) {
        this.handleCbFinished(err, job);
      }
    }, 0);
  }

  // TODO: test
  private handleTimeoutOfJob = (job: Job) => {
    // mark as canceled to get not called handleCbFinished() if promise will finally fulfilled
    job[JobPositions.canceled] = true;

    const errMsg = `RequestQueue: Timeout of job "${job[JobPositions.id]}" has been exceeded`;

    this.finalizeCurrentJob();
    this.endJobEvents.emit(errMsg, job[JobPositions.id]);

    try {
      this.startNextJob();
    }
    catch (err) {
      this.logError(`Error occurred on starting a new job after exceeded timeout: ${err}`);
    }
  }

  private handleCbFinished(err: string | undefined, job: Job) {
    // do nothing if it was canceled
    if (job[JobPositions.canceled]) return;

    if (!this.currentJob) {
      return this.logError(`RequestQueue: Not current job when a job finished`);
    }
    else if (this.currentJob[JobPositions.id] !== job[JobPositions.id]) {
      return this.logError(`RequestQueue: Current job id doesn't match with the finished job id`);
    }

    this.finalizeCurrentJob();
    this.endJobEvents.emit(err, job[JobPositions.id]);
    this.afterJobFinished(err, job);
  }

  private afterJobFinished(err: string | undefined, job: Job) {
    if (!err && job[JobPositions.mode] === 'recall' && job[JobPositions.recall]) {
      // TODO: что есл ипроизошла ошибка и есть recall cb - следующий recall cb не должен выполниться


      try {
        this.switchRecallJob(job);
      }
      catch (err) {
        this.logError(`Error occurred on starting a recall job "${job[JobPositions.id]}": ${err}`);
      }

      this.currentJob = job;
      this.startCurrentJob();

      return;
    }
    // if there is a error - go to the next job
    // if there isn't a recall cb - go to the next job like in the default mode
    // in default mode - just go to the next job

    try {
      this.startNextJob();
    }
    catch (err) {
      this.logError(`Error occurred on starting a new job after successful previous job: ${err}`);
    }
  }

  private switchRecallJob(job: Job) {
    const recallCb: RequestCb | undefined = job[JobPositions.recall];

    if (!recallCb) {
      throw new Error(`RequestQueue.recallJob: no recall cb`);
    }

    // move recall cb to a main cb in the job
    job[JobPositions.cb] = recallCb;
    delete job[JobPositions.recall];
  }

  private finalizeCurrentJob() {
    clearTimeout(this.runningTimeout);

    delete this.runningTimeout;
    // delete finished job
    delete this.currentJob;
  }

  private getWaitJobPromise(events: IndexedEvents<any>, jobId: JobId): Promise<void> {
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

  private cancelCurrentJob(jobId: string) {
    if (!this.currentJob || this.currentJob[JobPositions.id] !== jobId) return;

    this.currentJob[JobPositions.canceled] = true;

    this.finalizeCurrentJob();
    this.endJobEvents.emit(`Job was cancelled`, jobId);
  }

  /**
   * remove job or delayed job in queue
   */
  private removeJobFromQueue(jobId: JobId) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) return;

    this.queue.splice(jobIndex);
  }

  private getJobIndex(jobId: JobId): number {
    return this.queue.findIndex((item: Job) => item[JobPositions.id] === jobId);
  }

  private getQueuedJobs(): string[] {
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

}
