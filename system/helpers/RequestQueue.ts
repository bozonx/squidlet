import IndexedEvents from './IndexedEvents';
import {findIndex} from './lodashLike';

type RequestCb = () => Promise<void>;
type StartJobHandler = (jobId: JobId) => void;
type EndJobHandler = (error: Error | undefined, jobId: JobId) => void;
type JobId = string;
type Job = [JobId, RequestCb];

const ID_POSITION = 0;
const CB_POSITION = 1;
let unnamedJobId = -1;


// TODO: можно добавить режим запрещающий добавлять колбыки с тем же id


/**
 * Put callback to queue.
 * Callbacks with the same id will be make delayed.
 * Delayed cb will be called only once. The new delayed cb just will replace delayed cb to a new one.
 * Please don't use only numbers like "0" as an id. Use any other string as an id.
 */
export default class RequestQueue {
  private startJobEvents = new IndexedEvents<StartJobHandler>();
  private endJobEvents = new IndexedEvents<EndJobHandler>();
  private jobs: Job[] = [];
  private currentJob?: Job;


  constructor() {
  }

  destroy() {
    this.startJobEvents.removeAll();
    this.endJobEvents.removeAll();
    delete this.jobs;

    // TODO: cancel and delete current job
  }


  getQueueLength(): number {
    return this.jobs.length;
  }

  getJobIds(): string[] {
    return this.jobs.map((item: Job) => item[ID_POSITION]);
  }

  isJobInProgress(jobId: JobId): boolean {
    return this.getCurrentJobId() === jobId;
  }

  /**
   * Check if queue has job with specified jobId even it is a current job.
   */
  hasJob(jobId: JobId): boolean {
    if (this.currentJob && this.currentJob[ID_POSITION] === jobId) return true;

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
    // TODO: !!!!
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

  
  private resolveJobId(jobId: JobId | undefined): JobId {
    if (typeof jobId === 'string') return jobId;

    unnamedJobId++;

    return String(unnamedJobId);
  }

  private getJobIndex(jobId: JobId): number {
    return findIndex(this.jobs, (item: Job) => item[ID_POSITION] === jobId) as number;
  }

  private addToEndOfQueue(jobId: JobId, cb: RequestCb) {
    this.jobs.push([jobId, cb]);
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
      // add a new job
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

    // set first job in queue as current
    this.currentJob = this.jobs[0];

    const currentJobId: JobId = this.currentJob[ID_POSITION];

    // remove the first element
    this.jobs.shift();

    this.startJobEvents.emit(currentJobId);

    // TODO: add running timeout

    // start cb
    try {
      // TODO: как поднять ошибку в endOfJob ???
      this.currentJob[CB_POSITION]()
        .then(() => this.endOfJob(undefined, currentJobId))
        .catch((err: Error) => this.endOfJob(err, currentJobId));
    }
    catch (err) {
      this.endOfJob(err, currentJobId);
    }
  }

  private endOfJob(err: Error | undefined, jobId: JobId) {
    if (!this.currentJob) {
      throw new Error(`Not current job when a job finished`);
    }
    else if (this.currentJob[ID_POSITION] !== jobId) {
      throw new Error(`Current job id doesn't match with the finished job id`);
    }

    // delete finished job
    delete this.currentJob;

    this.endJobEvents.emit(err, jobId);
    this.startNextJob();
  }

}
