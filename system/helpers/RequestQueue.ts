type RequestCb = () => void;
type JobId = string;
type Job = [JobId, RequestCb];


const unnamedJobId = 0;


export default class RequestQueue {
  private jobs: Job[] = [];


  constructor() {
  }


  getJobsLength(): number {
    return this.jobs.length;
  }

  isJobInProgress(jobId: JobId): boolean {
    // TODO: !!!!
  }

  /**
   * Check if queue has job with specified jobId even it is a current job.
   */
  hadJob(jobId: JobId): boolean {
    // TODO: !!!!
  }

  /**
   * Returns id of current job of undefined
   */
  whichIsCurrentJob(): JobId | undefined {
    // TODO: !!!!
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
   */
  request(jobId: JobId | undefined, cb: RequestCb): JobId {
    // TODO: !!!!
  }

  onJobStart(cb: (jobId: JobId) => void) {
    // TODO: !!!!
  }

  onJobEnd(cb: (error: Error | undefined, jobId: JobId) => void) {
    // TODO: !!!!
  }

  
  private resolveJobId() {
    
  }
  
}
