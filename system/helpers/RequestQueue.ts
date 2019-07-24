type RequestCb = () => Promise<void>;
type JobId = string;
type Job = [JobId, RequestCb];

const ID_POSITION = 0;
const CB_POSITION = 1;
let unnamedJobId = -1;


/**
 * Put callback to queue.
 * Callbacks with the same id will be make delayed.
 * Delayed cb will be called only once. The new delayed cb just will replace delayed cb to a new one.
 * Please don't use only numbers like "0" as an id. Use any other string as an id.
 */
export default class RequestQueue {
  //private jobs: Job[] = [];
  private jobs: Job[] = [];
  private currentJob?: Job;


  constructor() {
  }


  getQueueLength(): number {
    return this.jobs.length;
  }

  isJobInProgress(jobId: JobId): boolean {
    return this.getCurrentJobId() === jobId;
  }

  /**
   * Check if queue has job with specified jobId even it is a current job.
   */
  hasJob(jobId: JobId): boolean {
    // TODO: !!!!
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
    // TODO: !!!!
  }

  /**
   * Add job to queue.
   * If job with the same jobId is in progress it will put to queue.
   * It there is queued delayed job - it just replace the callback with a new one.
   * It you doesn't set the id - it means just add cb to the end of queue.
   */
  request(jobId: JobId | undefined, cb: RequestCb): JobId {
    const resolvedId: JobId = this.resolveJobId(jobId);

    if (this.hasJob(resolvedId)) {
      this.updateDelayedJob(resolvedId, cb);
    }
    else {
      this.addToEndOfQueue(resolvedId, cb);
    }

    return resolvedId;
  }

  onJobStart(cb: (jobId: JobId) => void) {
    // TODO: !!!!
  }

  onJobEnd(cb: (error: Error | undefined, jobId: JobId) => void) {
    // TODO: !!!!
  }

  
  private resolveJobId(jobId: JobId | undefined): JobId {
    if (typeof jobId === 'string') return jobId;

    unnamedJobId++;

    return String(unnamedJobId);
  }

  private addToEndOfQueue(jobId: JobId, cb: RequestCb) {
    this.jobs.push([jobId, cb]);
    this.startNextJob();
  }

  private updateDelayedJob(jobId: JobId, cb: RequestCb) {
    // TODO: !!!!
    // if (this.getCurrentJobId() === resolvedId) {
    //
    // }
    // else {
    //
    // }
  }

  private startNextJob() {
    // do nothing if there is current job or no one in queue
    if (this.currentJob || !this.jobs.length) return;

    this.currentJob = this.jobs[ID_POSITION];

    // remove the first element
    this.jobs.shift();

    // start cb
    this.currentJob[CB_POSITION]()
      .then(() => {
        // TODO: !!!
      })
      .catch((err: Error) => {
        // TODO: !!!
      });
  }

}
