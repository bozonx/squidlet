import {isPromise} from './common';
import Promised from './Promised';


type QueuedCb = () => Promise<void>;

const DEFAULT_ID = 'default';


/**
 * Simple queue where callbacks are overwritten by a new one.
 * Steps:
 * Start:
 * * cb is calling right now and promise which is returned is waiting while it will finished
 * * if other cb is added then it will be executed as soon as current cb finish
 * * if some else cb is added then it will replace previous cb which is in queue
 */
export default class QueueOverride {
  private currentPendingPromise: {[index: string]: Promise<void>} = {};
  // promise witch represent when the queued cb will be finished
  private queueFinishPromise: {[index: string]: Promised<void>} = {};
  private queuedCb: {[index: string]: QueuedCb} = {};


  destroy() {
    delete this.currentPendingPromise;
    delete this.queueFinishPromise;
    delete this.queuedCb;
  }


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


  private startCb(cb: QueuedCb, id: string | number): Promise<void> {
    let promise: Promise<void>;

    try {
      promise = cb();
    }
    catch (e) {
      return Promise.reject(e);
    }

    if (!isPromise(promise)) {
      return Promise.reject(`Callback has to return a promise`);
    }

    // TODO: после выполнения запустить очредь

    return promise;
  }

}
