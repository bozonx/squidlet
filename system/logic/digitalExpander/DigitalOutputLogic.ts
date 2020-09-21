import QueueOverride from '../../lib/QueueOverride';
import {updateBitInByte} from '../../lib/binaryHelpers';
import BufferedRequest from '../../lib/BufferedRequest';


export default class DigitalOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (state: {[index: string]: boolean}) => Promise<void>;
  private readonly writeBufferMs?: number;
  private readonly queue: QueueOverride;
  private readonly bufferedRequest: BufferedRequest;
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: {[index: string]: boolean};
  // temporary state while writing
  private writingTimeBuffer?: {[index: string]: boolean};
  private state: {[index: string]: boolean} = {};


  constructor(
    logError: (msg: Error | string) => void,
    writeCb: (state: {[index: string]: boolean}) => Promise<void>,
    queueJobTimeoutSec?: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.writeBufferMs = writeBufferMs;
    this.queue = new QueueOverride(queueJobTimeoutSec);
    this.bufferedRequest = new BufferedRequest(this.startWriting, writeBufferMs);
  }

  destroy() {
    this.queue.destroy();
    this.debounce.destroy();
  }


  /**
   * Get the last actual state of all the pins input and output
   */
  getState(): {[index: string]: boolean} {
    return this.state;
  }

  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return typeof this.beforeWritingBuffer !== 'undefined';
  }

  isWriting(): boolean {
    return this.queue.isPending();
  }

  write(pin: number, value: boolean): Promise<void> {
    // in case it is writing at the moment - save buffer and add cb to queue
    if (this.isWriting()) {
      return this.invokeAtWritingTime(pin, value);
    }
    // start buffering step or update buffer
    else if(this.writeBufferMs) {
      // in buffering case collect data at the buffering time (before writing)
      return this.invokeBuffering(pin, value);
    }
    // else if buffering doesn't set - just start writing
    return this.startWriting({[pin]: value});
  }

  // TODO: review
  /**
   * Force write full state
   */
  async writeState(state: {[index: string]: boolean}): Promise<void> {
    // if buffering time - clear buffer and start write immediately
    if (this.isBuffering()) {
      this.debounce.clear();

      delete this.beforeWritingBuffer;
    }

    // in case it is writing at the moment - replace buffer and add cb to queue
    if (this.isWriting()) {
      // TODO: review
      this.writingTimeBuffer = state;
      // collect data into buffer

      // add to queue. It will be called after current writing has been done
      return this.queue.add(this.doWriteCb);
    }
    // else if writing isn't processing - just start a new writing
    return this.startWriting(state);
  }

  cancel() {
    this.debounce.clear();
    this.queue.stop();

    delete this.beforeWritingBuffer;
    delete this.writingTimeBuffer;
  }

  clearPin(pin: number) {
    delete this.state[pin];

    // TODO: add
  }


  /**
   * This method is called while buffering time.
   * All the changes are buffered and only the last one will be written.
   */
  private invokeBuffering(pin: number, value: boolean): Promise<void> {

    // TODO: сюда попадаем на второй раз, а на первый раз как устанавливается state

    // collect data into buffer
    if (typeof this.beforeWritingBuffer === 'undefined') {
      this.beforeWritingBuffer = {
        ...this.getState(),
      };
    }
    // set value to buffer
    this.beforeWritingBuffer[pin] = value;
    // only the last one cb will be called
    return this.debounce.invoke(() => {
      if (typeof this.beforeWritingBuffer === 'undefined') {
        return this.logError(`No buffer`);
      }

      const lastBufferedState: number = this.beforeWritingBuffer;
      // remove buffer which was used before writing has been started
      delete this.beforeWritingBuffer;

      // flush buffer which has been collected at buffering time
      this.startWriting(lastBufferedState)
        .catch(this.logError);
    }, this.writeBufferMs);
  }

  /**
   * Add writing to queue while current writing is in progress.
   * It can be called several times.
   */
  private invokeAtWritingTime(pin: number, value: boolean): Promise<void> {
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    this.writingTimeBuffer = updateBitInByte(this.writingTimeBuffer, pin, value);
    // collect data into buffer

    // add to queue. It will be called after current writing has been done
    return this.queue.add(this.doWriteCb);
  }

  // TODO: это вызывается сразу после буферизации
  /**
   * Start a new writing. It has to be called only once.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}): Promise<void> => {
    // TODO:  почему сюда а не в bufferTime
    this.writingTimeBuffer = stateToSave;

    return this.queue.add(this.doWriteCb);
  }

  private doWriteCb = async () => {
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    const state: number = this.writingTimeBuffer;

    try {
      await this.writeCb(state);
    }
    catch(e) {
      delete this.writingTimeBuffer;
      // the queue will be canceled
      throw e;
    }

    if (!this.queue.hasQueue()) {
      // remove buffer if there aren't no queue
      delete this.writingTimeBuffer;
    }

    // set a new state which has been just saved
    this.setState(state);
  }

}
