type RequestCb = () => void;
type UniqId = string | undefined;
type Job = [UniqId, RequestCb];


export default class RequestQueue {
  private jobs: Job[] = [];


  constructor() {
  }


  getJobsLength(): number {
    return this.jobs.length;
  }

  isJobInProgress(uniqId: UniqId): boolean {
    // TODO: !!!!
  }

  /**
   * Cancel current and delayed job with uniq id.
   */
  cancelJob(uniqId: UniqId) {
    // TODO: !!!!
  }

  /**
   * Add job to queue.
   * If job with the same uniqId is in progress it will put to queue.
   * It there is queued delayed job - it just replace the callback with a new one.
   */
  request(uniqId: UniqId, cb: RequestCb): Promise<void> {
    // TODO: !!!!
  }

  onJobStart(cb: (uniqId: UniqId) => void) {
    // TODO: !!!!
  }

  onJobEnd(cb: (error: Error | undefined, uniqId: UniqId) => void) {
    // TODO: !!!!
  }

}
