import {isPromise} from './common';
import Promised from './Promised';
import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';
import Timeout = NodeJS.Timeout;


type QueuedCb = () => Promise<void>;
// array like [pendingPromise, queuedCb, finishPromised, timeout]
type QueuedItem = [Promise<void>, QueuedCb | undefined, Promised<void> | undefined, Timeout | undefined];

enum QueuedItemPosition {
  // promise of current cb
  pendingPromise,
  queuedCb,
  // promise witch represent when the queued cb will be finished
  finishPromised,
  timeout,
}

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
  private items: {[index: string]: QueuedItem} = {};


  constructor(jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.jobTimeoutSec = jobTimeoutSec;
  }


  destroy() {
    for (let id of Object.keys(this.items)) {
      const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

      this.clearTimeout(id);

      if (finishPromised) finishPromised.destroy();

      delete this.items[id];
    }
  }


  isPending(id: string | number): boolean {
    if (!this.items[id]) return false;

    return Boolean(this.items[id][QueuedItemPosition.pendingPromise]);
  }

  hasQueuedCb(id: string | number): boolean {
    if (!this.items[id]) return false;

    return Boolean(this.items[id][QueuedItemPosition.queuedCb]);
  }

  /**
   * Cancel queue and waiting for current cb finished.
   * But if current cb is pending - it won't cancel it!
   */
  cancel(id: string | number) {
    if (!this.items[id]) return;

    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    this.clearTimeout(id);

    if (finishPromised) {
      finishPromised.cancel();
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  add(cb: QueuedCb, id: string | number = DEFAULT_ID): Promise<void> {
    // TODO: првоерить условие
    if (this.isPending(id)) {
      // just set or update a queued cb
      this.items[id][QueuedItemPosition.queuedCb] = cb;

      if (!this.queueFinishPromise[id]) {
        this.queueFinishPromise[id] = new Promised<void>();
      }

      return this.queueFinishPromise[id].promise;
    }



    // no one is in queue or pending - just start cb and return is't promise
    const pendingPromise: Promise<void> = this.startCb(cb, id);

    this.items[id] = [pendingPromise, undefined, undefined, undefined];

    return this.items[id][QueuedItemPosition.pendingPromise];
  }


  private async startCb(cb: QueuedCb, id: string | number) {

    // TODO: add timeout

    let promise: Promise<void>;
    // call
    try {
      promise = cb();
    }
    catch (e) {
      this.cancel(id);

      throw e;
    }
    // TODO: зачем требовать промис ????
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

    if (this.items[id][QueuedItemPosition.queuedCb]) {
      // after first cb is finished - start queued cb if need and don't wait for it
      this.startQueue(id);

      return;
    }
    // or just finish cycle if there isn't a queued cb
    this.finishCycle(id);
  }

  private startQueue(id: string | number) {
    if (!this.items[id]) return;

    delete this.items[id][QueuedItemPosition.pendingPromise];

    const queudCb: QueuedCb | undefined = this.items[id][QueuedItemPosition.queuedCb];
    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    if (!finishPromised) {
      throw new Error(`No finishPromised`);
    }

    // start queued cb

    // remove queue to start it
    delete this.items[id][QueuedItemPosition.queuedCb];
    delete this.items[id][QueuedItemPosition.finishPromised];
    // make current pending promise
    this.items[id][QueuedItemPosition.pendingPromise] = this.startCb(queudCb, id);

    this.items[id][QueuedItemPosition.pendingPromise]
      .then(finishPromised.resolve)
      .catch(finishPromised.reject);
  }

  private finishCycle(id: string | number) {
    if (!this.items[id]) return;

    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    this.clearTimeout(id);

    if (finishPromised) {
      finishPromised.resolve();
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  private clearTimeout(id: string | number) {
    if (!this.items[id]) return;

    const timeout: Timeout | undefined = this.items[id][QueuedItemPosition.timeout];

    if (timeout) {
      clearTimeout(timeout);
    }
  }

}
