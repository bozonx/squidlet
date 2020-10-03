import {DEFAULT_JOB_TIMEOUT_SEC} from './constants';
import Promised from './Promised';
import {isEmptyObject} from './objects';
import {callSafely} from './common';


// TODO: test


type QueuedCb = (stateToSave: {[index: string]: any}) => Promise<void>;


/**
 * It supports only flat structure of data.
 */
export default class BufferedQueue {
  private readonly jobTimeoutSec: number;
  // The last actual state which is saved
  private savedState: {[index: string]: any} = {};
  // temporary state while writing
  private writingState?: {[index: string]: any};
  // temporary state which will be written when queued cb is called
  private queueBuffer?: {[index: string]: any};
  private queuePromised?: Promised<void>;
  private queuedCb?: QueuedCb;

  get isDestroyed(): boolean {
    return !this.savedState;
  }


  constructor(jobTimeoutSec: number = DEFAULT_JOB_TIMEOUT_SEC) {
    this.jobTimeoutSec = jobTimeoutSec;
  }

  destroy() {
    if (this.queuePromised) this.queuePromised.destroy();

    delete this.savedState;
    delete this.queuePromised;
    delete this.queuedCb;
    delete this.writingState;
    delete this.queueBuffer;
  }


  getState(): {[index: string]: any} {
    return {
      ...this.savedState,
      ...this.writingState,
      ...this.queueBuffer,
    };
  }

  getSavedState(): {[index: string]: any} {
    return this.savedState;
  }

  /**
   * It means only some job is pending
   */
  isPending(): boolean {
    return Boolean(this.writingState);
  }

  /**
   * It means is pending and has queue
   */
  hasQueue(): boolean {
    return Boolean(this.queueBuffer);
  }

  stop() {
    if (this.queuePromised) this.queuePromised.reject(new Error(`Stopped`));

    this.clearWholeJob();
  }

  clearItem(itemKey: string | number) {
    delete this.savedState[itemKey];

    if (this.writingState) delete this.writingState[itemKey];
    if (this.queueBuffer) delete this.queueBuffer[itemKey];
  }

  async add(cb: QueuedCb, partialState: {[index: string]: any}): Promise<void> {
    // if some cb is in process and other is in queue - just update queue buffer and cb.
    if (this.hasQueue()) {
      if (!this.queuePromised) throw new Error(`no queuePromised`);
      // update queue buffer
      this.queueBuffer = {
        ...this.queueBuffer,
        ...partialState,
      };
      // replace cb to a new one
      this.queuedCb = cb;
      // return promise of the next cb is finished
      return this.queuePromised.promise;
    }
    // if some cb is in process but no queue - make queue buffer and queue cb.
    else if (this.isPending()) {
      // make queue buffer
      this.queueBuffer = {
        ...this.queueBuffer,
        ...partialState,
      };
      // save queue cb
      this.queuedCb = cb;
      // make promise of queued cb
      this.queuePromised = new Promised<void>();
      // return promise of the next cb is finished
      return this.queuePromised.promise;
    }
    // else a new one
    // just return promise of current writing
    await this.writeFirstTime(cb, partialState);
  }

  private async writeFirstTime(cb: QueuedCb, partialState: {[index: string]: any}) {
    if (this.writingState || this.queueBuffer || this.queuedCb) {
      throw new Error(`Unappropriated state`);
    }
    // if data to save is empty then do nothing.
    else if (isEmptyObject(partialState)) return;
    // it is used to get it in getState()
    this.writingState = {...partialState};

    try {
      await cb(this.writingState);
    }
    catch (e) {
      if (this.queuePromised) {
        this.queuePromised.reject(
          new Error(`Cancelled because current write has returned an error: ${e}`)
        );
      }
      // clear fully
      this.clearWholeJob();

      throw e;
    }
    // on success
    this.onSuccess();
  }

  private startQueuedCb() {
    if (!this.queueBuffer || !this.queuedCb || !this.queuePromised) {
      const msg = `no queueBuffer or queuedCb or queuePromised`;

      if (this.queuePromised) this.queuePromised.reject(new Error(msg));

      this.clearWholeJob();

      throw new Error(msg);
    }
    // if buffer was cleared during previous writing then do nothing.
    else if (isEmptyObject(this.queueBuffer)) {
      // resolve queued promise
      this.queuePromised.resolve();
      // finish the whole job
      this.clearWholeJob();

      return;
    }

    // make a new writing state
    this.writingState = {...this.queueBuffer};

    const queuedCb = this.queuedCb;
    const queuePromised = this.queuePromised;
    // it will look like the first write is started
    delete this.queueBuffer;
    delete this.queuedCb;
    delete this.queuePromised;

    callSafely(queuedCb, this.writingState)
      .then(() => {
        // resolve queued promise
        queuePromised && queuePromised.resolve();
        this.onSuccess();
      })
      .catch((e) => {
        queuePromised.reject(e);
        this.queuePromised && this.queuePromised.reject(e);
        // finish the whole job
        this.clearWholeJob();
      });
  }

  private onSuccess() {
    // set a new state which has been just saved
    this.savedState = {
      ...this.savedState,
      ...this.writingState,
    };

    if (this.hasQueue()) {
      delete this.writingState;

      this.startQueuedCb();
    }
    else {
      // finish the whole job
      this.clearWholeJob();
    }
  }

  private clearWholeJob() {
    if (this.queuePromised && !this.queuePromised.isFulfilled()) {
      throw new Error(`Queue promise has to be fulfilled at clearing step`);
    }

    delete this.queuePromised;
    delete this.queuedCb;
    delete this.writingState;
    delete this.queueBuffer;
  }

}
