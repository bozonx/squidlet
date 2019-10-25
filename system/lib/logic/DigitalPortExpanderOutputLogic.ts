import QueueOverride from '../QueueOverride';
import {updateBitInByte} from '../binaryHelpers';
import DebounceCall from '../debounceCall/DebounceCall';


const WRITE_ID = 'write';


export default class DigitalPortExpanderLogic {
  private readonly logError: (msg: string) => void;
  private readonly writeCb: (state: number) => Promise<void>;
  private readonly getState: () => number;
  private readonly updateState: (pin: number, value: boolean) => void;
  private readonly writeBufferMs?: number;
  private readonly queue = new QueueOverride();
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: number;
  // temporary state while writing
  private writingTimeBuffer?: number;


  constructor(
    logError: (msg: string) => void,
    writeCb: (state: number) => Promise<void>,
    getState: () => number,
    updateState: (pin: number, value: boolean) => void,
    queueJobTimeoutSec: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.getState = getState;
    this.updateState = updateState;
    this.writeBufferMs = writeBufferMs;
  }

  destroy() {
    this.queue.destroy();
    this.debounce.destroy();
  }


  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return typeof this.beforeWritingBuffer !== 'undefined';
  }

  isWriting(): boolean {
    // TODO: можно использовать writingTimeBuffer
    return this.queue.isPending(WRITE_ID);
  }

  write(pin: number, value: boolean): Promise<void> {
    // in case it is writing at the moment - save buffer and add cb to queue
    if (this.isWriting()) return this.invokeAtWritingTime(pin, value);

    // in buffering case collect data at the buffering time (before writing)
    if (this.writeBufferMs) return this.invokeBeforeWriting(pin, value);

    // in case without buffering - just start writing wright now
    const stateToWrite = updateBitInByte(this.getState(), pin, value);

    return this.startWriting(stateToWrite);
  }

  async writeState(): Promise<void> {
    const state: number = this.getState();

    // TODO: add write whole current state
    // TODO: ожидать промиса конца записи
  }

  clearPin(pin: number) {
    // TODO: add
  }


  private invokeBeforeWriting(pin: number, value: boolean): Promise<void> {
    // collect data into buffer
    if (typeof this.beforeWritingBuffer === 'undefined') this.beforeWritingBuffer = this.getState();

    this.beforeWritingBuffer = updateBitInByte(this.beforeWritingBuffer, pin, value);
    // only the last one cb will be called
    return this.debounce.invoke(() => {
      // flush buffer which has been collected at buffering time
      this.startWriting()
        .catch((e: Error) => this.logError(String(e)));
    }, this.writeBufferMs, WRITE_ID);
  }

  private invokeAtWritingTime(pin: number, value: boolean): Promise<void> {
    // TODO: может означать что буфер начал записывается и его сбросили
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    this.beforeWritingBuffer = updateBitInByte(this.writingTimeBuffer, pin, value);
    // collect data into buffer


    // add to queue. It will be called after current writing has been done
    return this.queue.add(async () => {
      if (typeof this.writingTimeBuffer === 'undefined') {
        throw new Error(`no writingTimeBuffer`);
      }

      // when actually call back is called then use the last one buffer to save
      // TODO: remove buffer
      try {
        await this.writeCb(this.writingTimeBuffer);
      }
      catch(e) {
        // TODO: сбрасываем очередь
        this.logError(String(e));
      }

      this.currentState = this.writingTimeBuffer;
    });
  }

  private startWriting(): Promise<void> {
    this.writingTimeBuffer = this.beforeWritingBuffer || 0;
    // remove buffer which was used before writing has been started
    delete this.beforeWritingBuffer;

    return this.queue.add(async () => {
      if (typeof this.writingTimeBuffer === 'undefined') {
        return this.logError(`no writingTimeBuffer`);
      }

      const state: number = this.writingTimeBuffer;

      delete this.writingTimeBuffer;

      try {
        await this.writeCb(state);
      }
      catch(e) {
        this.logError(String(e));
      }
      // set a new state which has been just saved
      this.currentState = state;
    });
  }

  // private addToQueue(state: number) {
  //   return this.queue.add(async () => {
  //     try {
  //       await this.writeCb(state);
  //     }
  //     catch(e) {
  //       // TODO: сбрасываем очередь
  //       this.logError(String(e));
  //     }
  //     // set a new state which has been just saved
  //     this.currentState = state;
  //   });
  // }

}
