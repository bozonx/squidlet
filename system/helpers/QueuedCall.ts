/**
 * Call a function which returns a promise.
 * And if while it waits another call will be called after this.
 * But only the last function will be queued.
 * If there was an error - queue will be cleared.
 */
import Promised from './Promised';


export default class QueuedCall {
  private queuedPromise?: Promised<void>;
  private queuedCb?: (data?: {[index: string]: any}) => Promise<void>;
  private executing: boolean = false;
  private onSuccessCb?: () => void;
  private onErrorCb?: (err: Error) => void;


  destroy() {
    this.queuedPromise && this.queuedPromise.destroy();

    delete this.queuedCb;
    delete this.queuedPromise;
    delete this.executing;
    delete this.onSuccessCb;
    delete this.onErrorCb;
  }


  // TODO: проверить сработает ли
  isExecuting(): boolean {
    // TODO: review - может использовать queuedCb
    return this.executing;
  }

  async callIt(cb: () => Promise<void>, data?: {[index: string]: any}): Promise<void> {
    // TODO: надо записывать смерженный стейт с предыдущими попытками после  - 2й раз и далее

    // // make old state which was before writing
    // if (this.tmpStateBeforeWriting) {
    //   this.tmpStateBeforeWriting = mergeDeep(partialData, this.tmpStateBeforeWriting);
    // }
    // else {
    //   this.tmpStateBeforeWriting = partialData;
    //   //this.tmpStateBeforeWriting = mergeDeep(partialData, this.system.state.getState(this.stateCategory, this.deviceId));
    // }

    // set to queue
    if (this.executing) {
      this.queuedCb = cb;

      if (!this.queuedPromise) this.queuedPromise = new Promised();

      return this.queuedPromise.promise;
    }

    // start new
    this.executing = true;

    // TODO: если произошла ошибка - то очистить очередь

    await cb();

    this.finish();
  }

  /**
   * Only one the last cb will be called on success
   */
  callOnceOnSuccess(cb: () => void) {
    this.onSuccessCb = cb;
  }

  /**
   * Only one the last cb will be called on error
   */
  callOnceOnError(cb: (err: Error) => void) {
    this.onErrorCb = cb;
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

    // TODO: add onSuccessCb and onErrorCb and remove them
  }

}
