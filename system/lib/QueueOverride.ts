import {isPromise} from './common';
import Promised from './Promised';
import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';
import Timeout = NodeJS.Timeout;


type QueuedCb = () => Promise<void> | void;
// array like [pendingPromise, queuedCb, finishPromised, timeout]
type QueuedItem = [Promise<void>, QueuedCb?, Promised<void>?, Timeout?];

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
  private readonly logError: (msg: string) => void;
  private items: {[index: string]: QueuedItem} = {};


  constructor(logError: (msg: string) => void, jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.logError = logError;
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

  /**
   * Is current cb pending
   */
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
    if (this.isPending(id)) {
      const item: QueuedItem = this.items[id];
      // just set or update a queued cb
      item[QueuedItemPosition.queuedCb] = cb;

      // and crate a finished Promised if need
      if (!item[QueuedItemPosition.finishPromised]) {
        item[QueuedItemPosition.finishPromised] = new Promised<void>();
      }

      return (item[QueuedItemPosition.finishPromised] as Promised<void>).promise;
    }

    // no one is in queue or pending - just start cb and return is't promise
    const pendingPromise: Promise<void> = this.startCb(cb, id);

    this.items[id] = [pendingPromise];

    return this.items[id][QueuedItemPosition.pendingPromise];
  }


  private async startCb(cb: QueuedCb, id: string | number) {
    if (!this.items[id]) throw new Error(`No item ${id}`);

    this.items[id][QueuedItemPosition.timeout] = setTimeout(() => {
      this.handleJobTimeout(id);
    }, this.jobTimeoutSec);

    try {
      this.callCb(cb);
    }
    catch (e) {
      this.handleCbError(id, e);

      throw e;
    }

    // after first cb successfully finished
    this.handleCbSuccess(id);
  }

  private handleCbError(id: string | number, e: Error) {
    // clear queue on error
    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    this.clearTimeout(id);

    // if there is queue - then reject queue promise
    if (finishPromised) {
      finishPromised.reject(e);
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  private handleCbSuccess(id: string | number) {
    this.clearTimeout(id);

    if (this.hasQueuedCb(id)) {
      // start queued cb if need and don't wait for it
      this.startQueue(id);

      return;
    }
    // or just finish cycle if there isn't a queued cb
    this.finishCycle(id);
  }

  private handleJobTimeout(id: string | number) {
    const msg = `Timeout of job "${id}" has been exceeded`;

    // TODO: убедиться что выполнившийся колбэк после таймаута уже ничего не сделает
    // TODO: если сделать обертку promised для главного промиса - то можно туда затулить error
    this.logError(msg);

    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    // if there is queue - then reject queue promise
    if (finishPromised) {
      finishPromised.reject(new Error(msg));
      finishPromised.destroy();
    }

    delete this.items[id];
  }

  private startQueue(id: string | number) {
    if (!this.items[id]) return;

    const queuedCb: QueuedCb | undefined = this.items[id][QueuedItemPosition.queuedCb];
    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    if (!queuedCb) {
      throw new Error(`No queuedCb`);
    }
    else if (!finishPromised) {
      throw new Error(`No finishPromised`);
    }

    // remove queue to start it
    delete this.items[id][QueuedItemPosition.queuedCb];
    delete this.items[id][QueuedItemPosition.finishPromised];
    // make current pending promise
    this.items[id][QueuedItemPosition.pendingPromise] = this.startCb(queuedCb, id);

    this.items[id][QueuedItemPosition.pendingPromise]
      .then(finishPromised.resolve)
      .catch(finishPromised.reject);
  }

  private finishCycle(id: string | number) {
    if (!this.items[id]) return;

    const finishPromised: Promised<void> | undefined = this.items[id][QueuedItemPosition.finishPromised];

    //this.clearTimeout(id);

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

  private async callCb(cb: QueuedCb) {
    await cb();
  }

}
