import Timeout = NodeJS.Timeout;

import Promised from './Promised';
import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';


type QueuedCb = () => Promise<void> | void;
// TODO: зачем сохранять таймаут на каждую job если он 1 для current job
// array like [pendingPromise, queuedCb, finishPromised, timeout]
type QueuedItem = [Promised<void>, QueuedCb?, Promised<void>?, Timeout?];

enum ItemPosition {
  // promise of current cb
  pendingPromised,
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
 * * if timeout of executing cb is exceeded then queue will be cleared
 */
export default class QueueOverride {
  private readonly jobTimeoutSec: number;
  private readonly logError: (msg: string) => void;
  private items: {[index: string]: QueuedItem} = {};


  constructor(logError: (msg: string) => void, jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.logError = logError;
    this.jobTimeoutSec = jobTimeoutSec;
  }


  destroy() {
    for (let id of Object.keys(this.items)) {
      const finishPromised: Promised<void> | undefined = this.items[id][ItemPosition.finishPromised];

      if (finishPromised) finishPromised.destroy();
      this.items[id][ItemPosition.pendingPromised].destroy();
      this.clearTimeout(id);

      delete this.items[id];
    }
  }

  /**
   * Is current cb pending
   */
  isPending(id: string | number = DEFAULT_ID): boolean {
    return Boolean(this.items[id]);
  }

  hasQueue(id: string | number = DEFAULT_ID): boolean {
    if (!this.items[id]) return false;

    return Boolean(this.items[id][ItemPosition.queuedCb]);
  }

  /**
   * Stop waiting and clear timeouts.
   * It will resolve promises and removes queue and current cb.
   */
  stop(id: string | number = DEFAULT_ID) {
    if (!this.items[id]) return;

    const pendingPromised: Promised<void> | undefined = this.items[id][ItemPosition.pendingPromised];
    const finishPromised: Promised<void> | undefined = this.items[id][ItemPosition.finishPromised];

    this.clearTimeout(id);

    if (pendingPromised) {
      pendingPromised.resolve();
      pendingPromised.destroy();
    }

    if (finishPromised) {
      finishPromised.resolve();
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  add(cb: QueuedCb, id: string | number = DEFAULT_ID): Promise<void> {
    if (this.isPending(id)) {
      const item: QueuedItem = this.items[id];
      // just set or update a queued cb
      item[ItemPosition.queuedCb] = cb;

      // and crate a finished Promised if need
      if (!item[ItemPosition.finishPromised]) {
        item[ItemPosition.finishPromised] = new Promised<void>();
      }
      // return promise which will be resolved after queued cb finished
      return (item[ItemPosition.finishPromised] as Promised<void>).promise;
    }
    // else no one is in queue or pending - just start cb and return is't promise
    this.items[id] = [new Promised<void>()];

    this.startCb(cb, id);

    return this.items[id][ItemPosition.pendingPromised].promise;
  }


  private startCb(cb: QueuedCb, id: string | number) {
    if (!this.items[id]) throw new Error(`No item ${id}`);

    this.items[id][ItemPosition.timeout] = setTimeout(() => {
      this.handleJobTimeout(id);
    }, this.jobTimeoutSec * 1000);

    this.callCb(cb)
      .then(() => this.handleCbSuccess(id))
      .catch((e: Error) => this.handleCbError(id, e));
  }

  private handleCbError(id: string | number, e: Error) {
    // if no item - means timeout has been exceeded
    if (!this.items[id]) return;

    // clear queue on error
    const pendingPromised: Promised<void> | undefined = this.items[id][ItemPosition.pendingPromised];
    const finishPromised: Promised<void> | undefined = this.items[id][ItemPosition.finishPromised];

    this.clearTimeout(id);
    // reject current cb promise
    pendingPromised.reject(e);
    pendingPromised.destroy();

    // if there is queue - then reject queue promise
    if (finishPromised) {
      finishPromised.reject(e);
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  private handleCbSuccess(id: string | number) {
    // if no item - means timeout has been exceeded
    if (!this.items[id]) return;

    const pendingPromised: Promised<void> | undefined = this.items[id][ItemPosition.pendingPromised];

    this.clearTimeout(id);
    // resolve current cb promise
    pendingPromised.resolve();
    pendingPromised.destroy();

    this.startNextStep(id);
  }

  private startNextStep(id: string | number) {
    if (this.hasQueue(id)) {
      // start queued cb if need and don't wait for it
      this.startQueue(id);

      return;
    }
    // or just finish cycle if there isn't a queued cb
    if (!this.items[id] || this.items[id][ItemPosition.finishPromised]) {
      this.logError(`No queue but there is finishPromised`);
    }

    delete this.items[id];
  }

  /**
   * Reject current cb and clear queue
   */
  private handleJobTimeout(id: string | number) {
    if (!this.items[id]) return this.logError(`No item ${id}`);

    const msg = `Timeout of job "${id}" has been exceeded`;
    const pendingPromised: Promised<void> | undefined = this.items[id][ItemPosition.pendingPromised];
    const finishPromised: Promised<void> | undefined = this.items[id][ItemPosition.finishPromised];

    // reject current cb promise
    pendingPromised.reject(new Error(msg));
    pendingPromised.destroy();
    // if there is queue - then reject queue promise
    if (finishPromised) {
      finishPromised.reject(new Error(msg));
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  private startQueue(id: string | number) {
    if (!this.items[id]) return;

    const queuedCb: QueuedCb | undefined = this.items[id][ItemPosition.queuedCb];
    const finishPromised: Promised<void> | undefined = this.items[id][ItemPosition.finishPromised];
    const newPendingPromised = new Promised<void>();

    if (!queuedCb) {
      throw new Error(`No queuedCb`);
    }
    else if (!finishPromised) {
      throw new Error(`No finishPromised`);
    }

    // remove queue to start it
    delete this.items[id][ItemPosition.queuedCb];
    delete this.items[id][ItemPosition.finishPromised];
    // make current pending promise
    this.items[id][ItemPosition.pendingPromised] = newPendingPromised;

    this.startCb(queuedCb, id);

    newPendingPromised.promise
      .then(finishPromised.resolve)
      .catch(finishPromised.reject);
  }

  private clearTimeout(id: string | number) {
    if (!this.items[id]) return;

    const timeout: Timeout | undefined = this.items[id][ItemPosition.timeout];

    if (timeout) {
      clearTimeout(timeout);
    }
  }

  private async callCb(cb: QueuedCb) {
    await cb();
  }

}
