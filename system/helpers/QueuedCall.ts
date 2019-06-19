/**
 * Call a function which returns a promise.
 * And if while it waits another call will be called after this.
 * But only the last function will be queued.
 * If there was an error - queue will be cleared.
 */
import Promised from './Promised';


export default class QueuedCall {
  wholePromise?: Promised<void>;

  private queuedCb?: () => Promise<void>;
  private queuedPromise?: Promised<void>;
  private executing: boolean = false;


  isExecuting(): boolean {
    // TODO: review - может использовать queuedCb
    return this.executing;
  }

  async callIt(cb: () => Promise<void>): Promise<void> {
    // set to queue
    if (this.executing) {
      this.queuedCb = cb;

      if (!this.queuedPromise) this.queuedPromise = new Promised();

      return this.queuedPromise.promise;
    }

    // start new
    this.executing = true;

    // TODO: если произошла ошибка - то очистить очередь
    // TODO: wholePromise

    await cb();

    this.finish();
  }


  private finish() {
    this.executing = false;

    const prevQueuedPromise = this.queuedPromise;
    delete this.queuedPromise;

    if (this.queuedCb && prevQueuedPromise) {
      const queuedCb = this.queuedCb;

      delete this.queuedCb;

      this.callIt(queuedCb)
        .then(prevQueuedPromise.resolve)
        .catch(prevQueuedPromise.reject);
    }
  }

}
