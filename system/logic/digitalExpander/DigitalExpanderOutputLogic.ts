import QueueOverride from '../../lib/QueueOverride';
import BufferedRequest from '../../lib/BufferedRequest';
import {isEmptyObject} from '../../lib/objects';


/**
 * Buffering write requests for 10ms and put requests to queue.
 */
export default class DigitalExpanderOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (changedState: {[index: string]: boolean}) => Promise<void>;
  private readonly writeBufferMs?: number;
  private readonly bufferedRequest: BufferedRequest;
  private readonly queue: QueueOverride;
  // temporary state while writing
  private writingState?: {[index: string]: boolean};
  // temporary state which will be written when queued cb is called
  private writingQueueBuffer?: {[index: string]: boolean};
  // The last actual state which is saved to IC
  private savedState: {[index: string]: boolean} = {};


  constructor(
    logError: (msg: Error | string) => void,
    writeCb: (changedState: {[index: string]: boolean}) => Promise<void>,
    queueJobTimeoutSec?: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.writeBufferMs = writeBufferMs;
    this.bufferedRequest = new BufferedRequest(this.startWriting, writeBufferMs);
    this.queue = new QueueOverride(queueJobTimeoutSec);
  }

  destroy() {
    this.queue.destroy();
    this.bufferedRequest.destroy();
  }


  /**
   * Get the last actual state of all the output pins.
   * Mixed saved state and a new one.
   */
  getState(): {[index: string]: boolean} {
    return {
      ...this.savedState,
      ...this.writingState || {},
      ...this.writingQueueBuffer || {},
    };
  }

  getSavedState(): {[index: string]: boolean} {
    return this.savedState;
  }

  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return this.bufferedRequest.isBuffering();
  }

  isWriting(): boolean {
    return this.queue.isPending();
  }

  cancel() {
    this.bufferedRequest.cancel();
    this.queue.stop();

    delete this.writingState;
    delete this.writingQueueBuffer;
  }

  clearPin(pin: number) {
    delete this.savedState[pin];

    if (this.writingState) delete this.writingState[pin];
    if (this.writingQueueBuffer) delete this.writingQueueBuffer[pin];
  }

  write(pin: number, value: boolean): Promise<void> {
    return this.writeState({[pin]: value});
  }

  /**
   * Write full or partial state
   */
  async writeState(partialState: {[index: string]: boolean}): Promise<void> {
    // if (this.isWriting()) {
    //   // TODO: what to do ????
    // }
    if (this.writingState) {
      // TODO: более точное условие ожидания writing
      // waiting for writing
      // If second and further times
      // update writing buffer
      this.writingState = {
        ...this.writingState,
        ...partialState,
      };
      return this.queue.add(this.doWriteCb);
    }
    else if (this.writingQueueBuffer) {
      // TODO: what to do ????
    }
    // else it is in a buffering state or it is a new request
    return this.bufferedRequest.write(partialState);
  }


  /**
   * Start a new writing. It is called after buffering time.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}): Promise<void> => {
    // at buffering time writingState is undefined
    // use it to pass data to doWriteCb() and get this state in getState()
    this.writingState = {...stateToSave};
    // first write request will be called write now at the current tick
    return this.queue.add(this.doWriteCb);
  }

  private doWriteCb = async () => {
    let stateToWrite: {[index: string]: boolean};
    // if is going to queue
    if (this.writingQueueBuffer) {
      if (isEmptyObject(this.writingQueueBuffer)) return;

      stateToWrite = {...this.writingQueueBuffer};

      this.writingState = this.writingQueueBuffer;

      delete this.writingQueueBuffer;
    }
    // if first time
    else if (this.writingState) {
      if (isEmptyObject(this.writingState)) return;

      stateToWrite = {...this.writingState};
    }
    else {
      throw new Error(`no state to write`);
    }

    try {
      await this.writeCb(stateToWrite);
    }
    catch (e) {
      // remove buffer because the queue will be cancelled
      delete this.writingState;
      delete this.writingQueueBuffer;

      throw e;
    }

    delete this.writingState;

    // TODO: надо поднять событие что было изменение стейта
    //       инача переключатели в UI не отработают
    //       либо это делать уровнем выше на ошибку

    // if (!this.queue.hasQueue()) {
    //   // remove buffer if there aren't no queue
    //   delete this.writingState;
    // }

    // set a new state which has been just saved
    this.savedState = {
      ...this.savedState,
      ...stateToWrite,
    };
  }

}
