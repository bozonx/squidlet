import {isPromise} from './common';
import Promised from './Promised';
import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';


type QueuedCb = () => Promise<void>;

const DEFAULT_ID = 'default';


/**
 * Simple queue where callbacks are overwritten by a new one.
 * Logic:
 * * cb is calling right now and promise which is returned is waiting while it will finished
 * * if other cb is added then it will be executed as soon as current cb finish
 * * if some else cb is added then it will replace previous cb which is in queue
 * * if there was an error while current cb is executed then queue will be cancelled
 */
export default class QueueOverride {
  private readonly jobTimeoutSec: number;
  private currentPendingPromise: {[index: string]: Promise<void>} = {};
  // promise witch represent when the queued cb will be finished
  private queueFinishPromise: {[index: string]: Promised<void>} = {};
  private queuedCb: {[index: string]: QueuedCb} = {};


  constructor(jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.jobTimeoutSec = jobTimeoutSec;
  }


  destroy() {
    delete this.currentPendingPromise;
    delete this.queueFinishPromise;
    delete this.queuedCb;
  }


  // isInProgress(id: string | number): boolean {
  //   return this.isPending(id) || this.hasQueuedCb(id);
  // }

  isPending(id: string | number): boolean {
    return Boolean(this.currentPendingPromise);
  }

  hasQueuedCb(id: string | number): boolean {
    return Boolean(this.queuedCb);
  }

  /**
   * Cancel queue and waiting for current cb finished.
   * But if current cb is pending - it won't cancel it!
   */
  cancel(id: string | number) {
    delete this.currentPendingPromise[id];
    delete this.queueFinishPromise[id];
    delete this.queuedCb[id];
  }

  add(cb: QueuedCb, id: string | number = DEFAULT_ID): Promise<void> {
    if (this.isPending(id)) {
      // just set or update a queued cb
      this.queuedCb[id] = cb;

      if (!this.queueFinishPromise[id]) {
        this.queueFinishPromise[id] = new Promised<void>();
      }

      return this.queueFinishPromise[id].promise;
    }

    // no one is in queue or pending - just start cb and return is't promise
    this.currentPendingPromise[id] = this.startCb(cb, id);

    return this.currentPendingPromise[id];
  }


  private async startCb(cb: QueuedCb, id: string | number) {
    let promise: Promise<void>;
    // call
    try {
      promise = cb();
    }
    catch (e) {
      this.cancel(id);

      throw e;
    }
    // check if it promise
    if (!isPromise(promise)) {
      this.cancel(id);

      throw new Error(`Callback has to return a promise`);
    }
    // wait for the end
    try {
      await promise;
    }
    catch (e) {
      // cancel queue on error
      this.cancel(id);

      throw e;
    }

    this.startQueue(id);
  }

  private startQueue(id: string | number) {
    delete this.currentPendingPromise[id];

    if (!this.queuedCb[id]) {
      // end of cycle if there isn't any queue
      return;
    }
    else if (!this.queueFinishPromise[id]) {
      throw new Error(`No queueFinishPromise`);
    }

    const cb: QueuedCb = this.queuedCb[id];
    const queueFinishPromise = this.queueFinishPromise[id];
    // remove queue to start it
    delete this.queuedCb[id];
    delete this.queueFinishPromise[id];
    // make current pending promise
    this.currentPendingPromise[id] = this.startCb(cb, id);

    this.currentPendingPromise[id]
      .then(queueFinishPromise.resolve)
      .catch(queueFinishPromise.reject);
  }

}
