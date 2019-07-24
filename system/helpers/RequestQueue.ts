import IndexedEvents from './IndexedEvents';
import {findIndex} from './lodashLike';

type RequestCb = () => Promise<void>;
type StartJobHandler = (jobId: JobId) => void;
type EndJobHandler = (error: Error | undefined, jobId: JobId) => void;
type JobId = string;
// array like [JobId, RequestCb, isCanceled]
type Job = [JobId, RequestCb, boolean];

const ID_POSITION = 0;
const CB_POSITION = 1;
const CANCELED_POSITION = 2;
const DEFAULT_JOB_TIMEOUT_SEC = 120;
let unnamedJobIdCounter = -1;


// TODO: можно добавить режим запрещающий добавлять колбыки с тем же id


/**
 * Put callback to queue.
 * Callbacks with the same id will be make delayed.
 * Delayed cb will be called only once. The new delayed cb just will replace delayed cb to a new one.
 * Please don't use only numbers like "0" as an id. Use any other string as an id.
 */
export default class RequestQueue {
  private readonly jobTimeoutSec: number;
  private readonly startJobEvents = new IndexedEvents<StartJobHandler>();
  private readonly endJobEvents = new IndexedEvents<EndJobHandler>();
  private jobs: Job[] = [];
  private currentJob?: Job;
  private runningTimeout?: any;


  constructor(jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.jobTimeoutSec = jobTimeoutSec;
  }

  destroy() {
    this.startJobEvents.removeAll();
    this.endJobEvents.removeAll();
    clearTimeout(this.runningTimeout);

    if (this.currentJob) this.cancelCurrentJob(this.currentJob[ID_POSITION]);

    delete this.runningTimeout;
    delete this.jobs;
    delete this.currentJob;
  }


  getQueueLength(): number {
    return this.jobs.length;
  }

  /**
   * Get ids of jobs include current job.
   */
  getJobIds(): string[] {
    const queued = this.jobs.map((item: Job) => item[ID_POSITION]);

    if (this.currentJob) {
      return [this.currentJob[ID_POSITION], ...queued];
    }

    return queued;
  }

  isJobInProgress(jobId: JobId): boolean {
    return this.getCurrentJobId() === jobId;
  }

  /**
   * Check if queue has job with specified jobId even it it is a current job.
   */
  hasJob(jobId: JobId): boolean {
    return this.getJobIds().includes(jobId);
  }

  /**
   * Returns id of current job of undefined
   */
  getCurrentJobId(): JobId | undefined {
    if (!this.currentJob) return;

    return this.currentJob[ID_POSITION];
  }

  /**
   * Cancel current and delayed job with uniq id.
   */
  cancelJob(jobId: JobId) {
    this.cancelCurrentJob(jobId);
    this.removeJobFromQueue(jobId);
  }

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
  request(jobId: JobId | undefined, cb: RequestCb): JobId {
    const resolvedId: JobId = this.resolveJobId(jobId);

    // if job is in progress or delayed - update delayed job or add to queue
    if (this.hasJob(resolvedId)) {
      this.updateDelayedJob(resolvedId, cb);
    }
    else {
      // add a new job
      this.addToEndOfQueue(resolvedId, cb);
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

  private addToEndOfQueue(jobId: JobId, cb: RequestCb) {
    const job: Job = [jobId, cb, false];

    this.jobs.push(job);
  }

  /**
   * Update cb of delayed job or add a new job to queue.
   */
  private updateDelayedJob(jobId: JobId, cb: RequestCb) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex >= 0) {
      // update delayed job cb
      this.jobs[jobIndex][CB_POSITION] = cb;
    }
    else {
      // add a new job to the end of queue
      this.addToEndOfQueue(jobId, cb);
    }
  }

  /**
   * Start a new job if there isn't a current job and queue has some items.
   * It doesn't start a new job while current is in progress.
   */
  private startNextJob() {
    // do nothing if there is current job or no one in queue
    if (this.currentJob || !this.jobs.length) return;

    const currentJob: Job = this.jobs[0];
    const currentJobId: JobId = currentJob[ID_POSITION];

    // set first job in queue as current
    this.currentJob = currentJob;

    // remove the first element
    this.jobs.shift();

    this.startJobEvents.emit(currentJobId);

    this.runningTimeout = setTimeout(() => {
      currentJob[CANCELED_POSITION] = true;
      this.endOfJob(new Error(`Timeout of job "${currentJobId}" has been exceeded`), currentJob);
    }, this.jobTimeoutSec * 1000);

    // start cb
    try {
      // TODO: как поднять ошибку в endOfJob ???
      this.currentJob[CB_POSITION]()
        .then(() => this.endOfJob(undefined, currentJob))
        .catch((err: Error) => this.endOfJob(err, currentJob));
    }
    catch (err) {
      this.endOfJob(err, currentJob);
    }
  }

  private endOfJob(err: Error | undefined, job: Job) {
    // do nothing if it was canceled
    if (job[CANCELED_POSITION]) return;

    if (!this.currentJob) {
      throw new Error(`Not current job when a job finished`);
    }
    else if (this.currentJob[ID_POSITION] !== job[ID_POSITION]) {
      throw new Error(`Current job id doesn't match with the finished job id`);
    }

    clearTimeout(this.runningTimeout);

    delete this.runningTimeout;
    // delete finished job
    delete this.currentJob;

    this.endJobEvents.emit(err, job[ID_POSITION]);
    this.startNextJob();
  }

  private cancelCurrentJob(jobId: string) {
    if (this.currentJob && this.currentJob[ID_POSITION] === jobId) {
      this.currentJob[CANCELED_POSITION] = true;
    }
  }

  /**
   * remove job or delayed job in queue
   */
  private removeJobFromQueue(jobId: JobId) {
    const jobIndex: number = this.getJobIndex(jobId);

    if (jobIndex < 0) return;

    this.jobs.splice(jobIndex);
  }

}
