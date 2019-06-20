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
  private onAfterEachSuccessCb?: () => void;
  private onErrorCb?: (err: Error) => void;


  destroy() {
    this.queuedPromise && this.queuedPromise.destroy();

    delete this.queuedCb;
    delete this.queuedPromise;
    delete this.executing;
    delete this.onSuccessCb;
    delete this.onAfterEachSuccessCb;
    delete this.onErrorCb;
  }


  isExecuting(): boolean {
    return this.executing;
  }

  async callIt(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    // set to queue
    if (this.isExecuting()) {
      return this.setToQueue(cb, data);
    }

    // or start new
    return this.startNew(cb);
  }

  /**
   * Only when the last cb will be called successful
   */
  onSuccess(cb: () => void) {
    this.onSuccessCb = cb;
  }

  /**
   * It will be called after each successfully called callback.
   */
  onAfterEachSuccess(cb: () => void) {
    this.onAfterEachSuccessCb = cb;
  }

  /**
   * Only one the last cb will be called on error
   */
  onError(cb: (err: Error) => void) {
    this.onErrorCb = cb;
  }


  private async startNew(cb: QueuedCb): Promise<void> {
    this.executing = true;

    try {
      await cb();
    }
    catch (err) {
      // cancel queue on eror
      this.stopOnError(err);
      // throw error of first cb
      throw err;
    }

    const prevQueuedPromise = this.queuedPromise;

    delete this.queuedPromise;

    this.onAfterEachSuccessCb && this.onAfterEachSuccessCb();

    // start queue if there is a queuedCb
    if (this.queuedCb && prevQueuedPromise) return this.startQueue(prevQueuedPromise);
    // or finish cycle
    this.wholeCycleFinished();
  }

  private setToQueue(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    // TODO: надо записывать смерженный стейт с предыдущими попытками после  - 2й раз и далее
    // TODO: на resolve или reject промиса который возвращает ф-я должен произойти на все отложенные cb
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

  private startQueue(prevQueuedPromise: Promised) {
    // start queue
    const queuedCb = this.queuedCb;

    delete this.queuedCb;

    // TODO: review
    this.startNew(queuedCb)
      .then(prevQueuedPromise.resolve)
      .catch(prevQueuedPromise.reject);
  }

  private stopOnError(err: Error) {
    this.executing = false;

    // clean up queue on error
    this.queuedPromise && this.queuedPromise.reject(err);
    this.onErrorCb && this.onErrorCb(err);

    delete this.queuedPromise;
    delete this.queuedCb;
  }

  private wholeCycleFinished() {
    this.executing = false;

    // call on success
    this.onSuccessCb && this.onSuccessCb();

    delete this.onSuccessCb;
    delete this.onAfterEachSuccessCb;
    delete this.onErrorCb;
  }

}