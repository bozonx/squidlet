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
  // temporary state while saving values are buffering
  private beforeWritingBuffer?: number;


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
    return this.queue.isPending(WRITE_ID);
  }

  async write(pin: number, value: boolean): Promise<void> {
    // in case it is writing at the moment - save buffer and add cb to queue
    if (this.isWriting()) {
      // TODO: поставить в очередь - только 1  раз выполнится
      // TODO: нужно собрать буфер на следующий раз

      return;
    }

    // in buffering case collect data at the buffering time (before writing)
    if (this.writeBufferMs) {
      // TODO: почему не getState ???
      // collect data into buffer
      if (typeof this.beforeWritingBuffer === 'undefined') this.beforeWritingBuffer = 0;

      this.beforeWritingBuffer = updateBitInByte(this.beforeWritingBuffer, pin, value);
      // flush buffer which has been collected at buffering time
      this.debounce.invoke(() => {
        this.startWriting(this.beforeWritingBuffer || 0)
          .catch((e: Error) => this.logError(String(e)));

        delete this.beforeWritingBuffer;
      }, this.writeBufferMs, WRITE_ID)
        .catch((e) => this.logError(e));

      return;
    }
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


  private startWriting(state: number): Promise<void> {
    return this.queue.add(async () => {
      try {
        await this.writeCb(state);
      }
      catch(e) {
        // TODO: сбрасываем очередь
        this.logError(String(e));
      }

      this.currentState = state;
    });
  }

}
