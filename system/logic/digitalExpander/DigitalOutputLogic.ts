import QueueOverride from '../../lib/QueueOverride';
import BufferedRequest from '../../lib/BufferedRequest';


export default class DigitalOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (changedState: {[index: string]: boolean}) => Promise<void>;
  private readonly writeBufferMs?: number;
  private readonly bufferedRequest: BufferedRequest;
  private readonly queue: QueueOverride;
  // temporary state while writing
  private writingTimeBuffer?: {[index: string]: boolean};
  private state: {[index: string]: boolean} = {};


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
   * Get the last actual state of all the output pins
   */
  getState(): {[index: string]: boolean} {
    return this.state;
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

  write(pin: number, value: boolean): Promise<void> {
    return this.writeState({[pin]: value});
  }

  /**
   * Write full or partial state
   */
  async writeState(partialState: {[index: string]: boolean}): Promise<void> {
    if (this.writingTimeBuffer) {
      // Second and further time
      // update writing buffer
      this.writingTimeBuffer = {
        ...this.writingTimeBuffer,
        ...partialState,
      };
      return this.queue.add(this.doWriteCb);
    }
    // else it is in a buffering state or it is a new request
    return this.bufferedRequest.write(partialState);
  }

  cancel() {
    this.bufferedRequest.cancel();
    this.queue.stop();

    delete this.writingTimeBuffer;
  }

  clearPin(pin: number) {
    delete this.state[pin];

    // TODO: add
  }


  /**
   * Start a new writing.
   * It is called after buffering time.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}): Promise<void> => {
    this.writingTimeBuffer = {...stateToSave};
    // first write request will be called write now at the current tick
    return this.queue.add(this.doWriteCb);
  }

  private doWriteCb = async () => {
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    const changedState: {[index: string]: boolean} = {...this.writingTimeBuffer};
    const writtenState: {[index: string]: boolean} = {...this.writingTimeBuffer};
    // clear the buffer to collect a new data during writing time
    this.writingTimeBuffer = {};

    try {
      await this.writeCb(changedState);
    }
    catch (e) {
      delete this.writingTimeBuffer;

      throw e;
    }

    if (!this.queue.hasQueue()) {
      // remove buffer if there aren't no queue
      delete this.writingTimeBuffer;
    }

    // set a new state which has been just saved
    this.state = {
      ...this.state,
      ...writtenState,
    };
  }

}
