import {isPromise} from './common';

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
  private currentPendingPromise?: Promise<void>;


  constructor() {
  }


  isPending(id: string | number): boolean {
    return Boolean(this.currentPendingPromise);
  }

  hasQueuedCb(id: string | number): boolean {
    // TODO: add
  }

  add(cb: () => Promise<void>, id: string | number = DEFAULT_ID): Promise<void> {
    if (this.isPending(id)) {
      this.addToQueue(cb, id);

      if (!this.currentPendingPromise) {
        throw new Error(`No pending promise`);
      }

      return this.currentPendingPromise;
    }

    // no one is in queue or pending - just start cb and return is't promise
    const promise: Promise<void> = this.startCb(cb, id);

    this.currentPendingPromise = promise;

    return this.currentPendingPromise;
  }


  private addToQueue(cb: () => Promise<void>, id: string | number) {
    if (this.hasQueuedCb(id)) {

    }


  }

  private startCb(cb: () => Promise<void>, id: string | number): Promise<void> {
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

    return promise;
  }

}
