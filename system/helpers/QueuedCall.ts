/**
 * Call a function which returns a promise.
 * And if while it waits another call will be called after this.
 * But only the last function will be queued.
 */
import Promised from './Promised';


export default class QueuedCall {
  private queuedCb?: () => Promise<void>;
  private queuedPromise?: Promised<void>;
  private executing: boolean = false;


  async callIt(cb: () => Promise<void>): Promise<void> {
    // set to queue
    if (this.executing) {
      this.queuedCb = cb;

      if (!this.queuedPromise) this.queuedPromise = new Promised();

      return this.queuedPromise.promise;
    }

    // start new
    this.executing = true;

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
