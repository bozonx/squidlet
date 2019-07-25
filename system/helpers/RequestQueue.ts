import IndexedEvents from './IndexedEvents';
import {findIndex} from './lodashLike';


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
type Mode = 'default' | 'recall';

type RequestCb = () => Promise<void>;
type StartJobHandler = (jobId: JobId) => void;
type EndJobHandler = (error: Error | undefined, jobId: JobId) => void;
type JobId = string;
// array like [JobId, RequestCb, node, isCanceled, recallCb]
type Job = [JobId, RequestCb, Mode, boolean, RequestCb?];

const ID_POSITION = 0;
const CB_POSITION = 1;
const MODE_POSITION = 2;
const CANCELED_POSITION = 3;
const RECALL_CB_POSITION = 4;
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
  private jobs: Job[] = [];
  private currentJob?: Job;
  private runningTimeout?: any;


  constructor(logError: (msg: string) => void, jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.logError = logError;
    this.jobTimeoutSec = jobTimeoutSec;
  }

  destroy() {
    this.startJobEvents.removeAll();
    this.endJobEvents.removeAll();

    if (this.currentJob) this.cancelCurrentJob(this.currentJob[ID_POSITION]);

    delete this.jobs;

    this.finalizeCurrentJob();
  }


  getQueueLength(): number {
    return this.jobs.length;
  }

  /**
   * Get ids of jobs include current job.
   */
  getJobIds(): string[] {
    const queued = this.getQueuedJobs();

    if (this.currentJob) {
      return [this.currentJob[ID_POSITION], ...queued];
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

    return this.currentJob[ID_POSITION];
  }

  /**
   * Check if queue has job with specified jobId even it it is a current job.
   */
  hasJob(jobId: JobId): boolean {
    return this.getJobIds().includes(jobId);
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
   * Return the promise which will be fulfilled when the job is finished.
   * You should check that the queue has this job by calling `hasJob(jobId)`.
   */
  waitJobFinished(jobId: JobId): Promise<void> {
    if (!this.hasJob(jobId)) {
      throw new Error(`RequestQueue.waitJobFinished: There isn't any job "${jobId}"`);
    }

    return new Promise<void>((resolve, reject) => {
      const handlerIndex = this.endJobEvents.addListener(
        (error: Error | undefined, finishedJobId: JobId) => {
          if (finishedJobId === jobId) {
            this.endJobEvents.removeListener(handlerIndex);

            if (error) return reject(error);

            resolve();
          }
        }
      );
    });
  }

  /**
   * Add job to queue.
   * If job with the same jobId is in progress it will put to queue.
   * It there is queued delayed job - it just replace the callback with a new one.
   * It you doesn't set the id - it means just add cb to the end of queue.
   */
  request(jobId: JobId | undefined, mode: Mode = 'default', cb: RequestCb): JobId {
    const resolvedId: JobId = this.resolveJobId(jobId);

    // if the job is running
    if (this.currentJob && this.currentJob[ID_POSITION] === resolvedId) {
      if (mode === 'recall') {
        // set or replace recall cb in recall mode
        this.currentJob[RECALL_CB_POSITION] = cb;
      }
      // in default mode do noting - don't update the current job and don't add job to queue
    }
    // if the job in a queue
    else if (this.getQueuedJobs().includes(resolvedId)) {
      this.updateQueuedJob(resolvedId, mode, cb);
    }
    else {
      // add a new job
      this.addToEndOfQueue(resolvedId, mode, cb);
      this.startNextJob();
    }

    return resolvedId;
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


  private getQueuedJobs(): string[] {
    return this.jobs.map((item: Job) => item[ID_POSITION]);
  }

  /**
   * It uses passed jobId or generate a new one
   */
  private resolveJobId(jobId: JobId | undefined): JobId {
    if (typeof jobId === 'string') return jobId;

    unnamedJobIdCounter++;

    return String(unnamedJobIdCounter);
  }

  private getJobIndex(jobId: JobId): number {
    return findIndex(this.jobs, (item: Job) => item[ID_POSITION] === jobId) as number;
  }

  private cancelCurrentJob(jobId: string) {
    if (!this.currentJob || this.currentJob[ID_POSITION] !== jobId) return;

    this.currentJob[CANCELED_POSITION] = true;

    this.finalizeCurrentJob();
    this.endJobEvents.emit(new Error(`Job was cancelled`), jobId);
  }

  /**
   * remove job or delayed job in queue
   */
  private removeJobFromQueue(jobId: JobId) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) return;

    this.jobs.splice(jobIndex);
  }

  private addToEndOfQueue(jobId: JobId, mode: Mode, cb: RequestCb) {
    const job: Job = [jobId, cb, mode, false];

    this.jobs.push(job);
  }

  /**
   * Update cb of delayed job or add a new job to queue.
   */
  private updateQueuedJob(jobId: JobId, mode: Mode, cb: RequestCb) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) {
      throw new Error(`RequestQueue.updateQueuedJob: Can't find job index "${jobId}"`);
    }

    this.jobs[jobIndex][CB_POSITION] = cb;
    this.jobs[jobIndex][MODE_POSITION] = mode;
  }

  /**
   * Start a new job if there isn't a current job and queue has some jobs.
   * It doesn't start a new job while current is in progress.
   */
  private startNextJob() {
    // do nothing if there is current job or no one in queue
    if (this.currentJob || !this.jobs.length) return;

    const currentJob: Job = this.jobs[0];

    // set first job in queue as current
    this.currentJob = currentJob;

    // remove the first element from queue
    this.jobs.shift();

    this.startCb(currentJob);
  }

  private startCb(job: Job) {
    this.startJobEvents.emit(job[ID_POSITION]);

    this.runningTimeout = setTimeout(
      () => this.handleTimeoutOfJob(job),
      this.jobTimeoutSec * 1000
    );

    // start cb
    try {
      job[CB_POSITION]()
        .then(() => this.handleCbFinished(undefined, job))
        .catch((err: Error) => this.handleCbFinished(err, job));
    }
    catch (err) {
      this.handleCbFinished(err, job);
    }
  }

  private handleTimeoutOfJob = (job: Job) => {
    // mark as canceled to get not called handleCbFinished() if promise will finally fulfilled
    job[CANCELED_POSITION] = true;

    const errMsg = `RequestQueue: Timeout of job "${job[ID_POSITION]}" has been exceeded`;

    this.finalizeCurrentJob();
    this.endJobEvents.emit(new Error(errMsg), job[ID_POSITION]);
    this.startNextJob();
  }

  private handleCbFinished(err: Error | undefined, job: Job) {
    // do nothing if it was canceled
    if (job[CANCELED_POSITION]) return;

    const jobId: JobId = job[ID_POSITION];

    if (!this.currentJob) {
      return this.logError(`RequestQueue: Not current job when a job finished`);
    }
    else if (this.currentJob[ID_POSITION] !== jobId) {
      return this.logError(`RequestQueue: Current job id doesn't match with the finished job id`);
    }

    this.finalizeCurrentJob();

    if (job[MODE_POSITION] === 'recall') {
      if (!err && job[RECALL_CB_POSITION]) return this.recallJob(job);
      // if there is a error - go to the next job
      // if there isn't a recall cb - go to the next job like in the default mode
    }
    // in default mode - just go to the next job

    this.endJobEvents.emit(err, job[ID_POSITION]);
    this.startNextJob();
  }

  private recallJob(job: Job) {
    const recallCb: RequestCb | undefined = job[RECALL_CB_POSITION];

    if (!recallCb) {
      throw new Error(`RequestQueue.recallJob: no recall cb`);
    }

    // mutate just finished job
    job[CB_POSITION] = recallCb;
    delete job[RECALL_CB_POSITION];

    this.currentJob = job;

    this.endJobEvents.emit(undefined, job[ID_POSITION]);
    this.startCb(job);
  }

  private finalizeCurrentJob() {
    clearTimeout(this.runningTimeout);

    delete this.runningTimeout;
    // delete finished job
    delete this.currentJob;
  }

}
