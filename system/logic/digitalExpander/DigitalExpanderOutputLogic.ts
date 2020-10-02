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
    // If there is some cb waiting - just update buffer
    // Or if there is writing one job but no queue
    if (this.queue.isPending() || this.queue.hasQueue()) {
      // make buffer
      this.writingQueueBuffer = {
        ...this.writingQueueBuffer,
        ...partialState,
      };
      // add job to queue
      return this.queue.add(this.doWriteCb);
    }
    // else it is in a buffering state or it is a new request
    return this.bufferedRequest.write(partialState);
  }


  /**
   * Start a new writing. It is called after buffering time.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}): Promise<void> => {
    // at buffering time writingState is undefined
    if (this.writingState) throw new Error(`writingState exists at start new writing time`);
    // use it to pass data to doWriteCb() and get this state in getState()
    this.writingState = {...stateToSave};
    // first write request will be called write now at the current tick
    return this.queue.add(this.doWriteCb);
  }

  private doWriteCb = async () => {
    if (!this.writingState && !this.writingQueueBuffer) {
      throw new Error(`no state to write`);
    }

    // if is writing queued job
    if (this.writingQueueBuffer) {
      if (isEmptyObject(this.writingQueueBuffer)) return;

      this.writingState = {...this.writingQueueBuffer};

      this.writingState = this.writingQueueBuffer;

      delete this.writingQueueBuffer;
    }
    // else first time - use writingState
    // Let writingState exist while the writing process is finished because
    // it will be used in getState()

    if (!this.writingState || isEmptyObject(this.writingState)) return;

    try {
      await this.writeCb(this.writingState);
    }
    catch (e) {
      // remove all buffers because the queue will be cancelled
      delete this.writingState;
      delete this.writingQueueBuffer;

      throw e;
    }

    // TODO: надо поднять событие что было изменение стейта
    //       инача переключатели в UI не отработают
    //       либо это делать уровнем выше на ошибку

    // set a new state which has been just saved
    this.savedState = {
      ...this.savedState,
      ...this.writingState,
    };

    delete this.writingState;
  }

}
