// TODO: наверное не нужно - можно использовать RequestQueue с одним и тем же id


/**
 * Call a function which returns a promise.
 * And if while it waits another call will be called after this.
 * But only the last function will be queued.
 * If there was an error - queue will be cleared.
 */
import Promised from '../system/helpers/Promised';
import {mergeDeep} from '../system/helpers/collections';
import {isPlainObject} from '../system/helpers/lodashLike';


export type QueuedCb = (data?: {[index: string]: any}) => Promise<void>;


export default class QueuedCall {
  // promise which will be resolved after next cb in queue will be resolve. Or on the first error.
  private queuedPromise?: Promised<void>;
  private queuedCb?: QueuedCb;
  private executing: boolean = false;
  private onSuccessCb?: () => void;
  private onAfterEachSuccessCb?: () => void;
  private onErrorCb?: (err: Error) => void;
  private queuedData?: {[index: string]: any};


  destroy() {
    this.queuedPromise && this.queuedPromise.destroy();

    delete this.queuedCb;
    delete this.queuedData;
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
    return this.startNew(cb, data);
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


  private async startNew(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    this.executing = true;

    try {
      await cb(data);
    }
    catch (err) {
      // cancel queue on eror
      this.stopOnError(err);
      // throw error of first cb
      throw err;
    }

    // success
    this.afterCbSuccess();
  }

  private setToQueue(cb: QueuedCb, data?: {[index: string]: any}): Promise<void> {
    if (data) {
      if (!isPlainObject(data)) {
        throw new Error(`QueuedCall.setToQueue: data is not plain object: ${JSON.stringify(data)}`);
      }

      if (this.queuedData) {
        // TODO: можно ли от mergeDeep отказаться????
        this.queuedData = mergeDeep(data, this.queuedData);
      }
      else {
        this.queuedData = data;
      }
    }

    this.queuedCb = cb;

    if (!this.queuedPromise) this.queuedPromise = new Promised();

    return this.queuedPromise.promise;
  }

  private afterCbSuccess() {
    const prevQueuedPromise = this.queuedPromise;

    delete this.queuedPromise;

    this.onAfterEachSuccessCb && this.onAfterEachSuccessCb();

    // start queue if there is a queuedCb
    if (this.queuedCb && prevQueuedPromise) {
      this.startQueue(prevQueuedPromise);

      return;
    }

    // or finish cycle
    this.wholeCycleFinished();
  }

  private startQueue(prevQueuedPromise: Promised<void>) {
    if (!this.queuedCb) throw new Error(`No queuedCb`);

    // start queue
    const queuedCb = this.queuedCb;

    delete this.queuedCb;

    queuedCb(this.queuedData)
      .then(() => {
        prevQueuedPromise.resolve();
        this.afterCbSuccess();
      })
      .catch((err) => {
        prevQueuedPromise.reject(err);
        // cancel queue on error
        this.stopOnError(err);
      });
  }

  private stopOnError(err: Error) {
    this.executing = false;

    // clean up queue on error
    this.onErrorCb && this.onErrorCb(err);

    delete this.queuedPromise;
    delete this.queuedCb;
    delete this.queuedData;
    delete this.onSuccessCb;
    delete this.onAfterEachSuccessCb;
    delete this.onErrorCb;
  }

  private wholeCycleFinished() {
    this.executing = false;

    // call on success
    this.onSuccessCb && this.onSuccessCb();

    delete this.queuedPromise;
    delete this.queuedCb;
    delete this.queuedData;
    delete this.onSuccessCb;
    delete this.onAfterEachSuccessCb;
    delete this.onErrorCb;
  }

}
