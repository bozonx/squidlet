/**
 * Call a function which returns a promise.
 * And if while it waits another call will be called after this.
 * But only the last function will be queued.
 * If there was an error - queue will be cleared.
 */
import Promised from './Promised';


export type QueuedCb = (data?: {[index: string]: any}) => Promise<void>;


export default class QueuedCall {
  // TODO: review
  private queuedPromise?: Promised<void>;
  private queuedCb?: QueuedCb;
  private executing: boolean = false;
  private onSuccessCb?: () => void;
  private onAfterEachSuccess?: () => void;
  private onErrorCb?: (err: Error) => void;


  destroy() {
    this.queuedPromise && this.queuedPromise.destroy();

    delete this.queuedCb;
    delete this.queuedPromise;
    delete this.executing;
    delete this.onSuccessCb;
    delete this.onAfterEachSuccess;
    delete this.onErrorCb;
  }


  isExecuting(): boolean {
    return this.executing;
  }

  // TODO: ошибка должна произойти на текущий cb
  async callIt(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    // set to queue
    if (this.isExecuting()) {
      return this.setToQueue(cb, data);
    }

    // or start new

    this.executing = true;

    try {
      await cb();
    }
    catch (err) {
      this.stopOnError(err);

      // TODO: делать throw если это 1й запуск ???

      throw err;
    }

    this.finish();
  }

  /**
   * Only one the last cb will be called on success
   */
  callOnceOnSuccess(cb: () => void) {
    this.onSuccessCb = cb;
  }

  /**
   * It will be called after each successfully called callback.
   */
  onAfterEachCb(cb: (err?: Error) => void) {
    this.onAfterEachSuccess = cb;
  }

  /**
   * Only one the last cb will be called on error
   */
  callOnceOnError(cb: (err: Error) => void) {
    this.onErrorCb = cb;
  }


  private setToQueue(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    // TODO: надо записывать смерженный стейт с предыдущими попытками после  - 2й раз и далее

    // // make old state which was before writing
    // if (this.tmpStateBeforeWriting) {
    //   this.tmpStateBeforeWriting = mergeDeep(partialData, this.tmpStateBeforeWriting);
    // }
    // else {
    //   this.tmpStateBeforeWriting = partialData;
    //   //this.tmpStateBeforeWriting = mergeDeep(partialData, this.system.state.getState(this.stateCategory, this.deviceId));
    // }

    this.queuedCb = cb;

    if (!this.queuedPromise) this.queuedPromise = new Promised();

    return this.queuedPromise.promise;
  }

  private finish() {
    const prevQueuedPromise = this.queuedPromise;
    delete this.queuedPromise;

    this.onAfterEachSuccess && this.onAfterEachSuccess();

    if (this.queuedCb && prevQueuedPromise) {
      // start queue
      const queuedCb = this.queuedCb;

      delete this.queuedCb;

      this.callIt(queuedCb)
        .then(prevQueuedPromise.resolve)
        .catch(prevQueuedPromise.reject);

      return;
    }

    this.wholeCycleFinished();
  }

  private stopOnError(err: Error) {
    // clean up queue on error
    this.queuedPromise && this.queuedPromise.reject(err);
    this.onAfterEachSuccess && this.onAfterEachSuccess(err);
    this.onErrorCb && this.onErrorCb(err);

    delete this.queuedPromise;
    delete this.queuedCb;

    this.executing = false;
  }

  private wholeCycleFinished() {
    this.executing = false;

    // call on success
    this.onSuccessCb && this.onSuccessCb();

    delete this.onSuccessCb;
    delete this.onAfterEachSuccess;
    delete this.onErrorCb;
  }

}
