import RequestQueue from '../RequestQueue';
import {updateBitInByte} from '../binaryHelpers';
import DebounceCall from '../debounceCall/DebounceCall';


const DEBOUNCE_WRITE_ID = 'write';


export default class DigitalPortExpanderLogic {
  private readonly logError: (msg: string) => void;
  private readonly writeCb: (state: number) => Promise<void>;
  private readonly getState: () => number;
  private readonly updateState: (pin: number, value: boolean) => void;
  private readonly writeBufferMs?: number;
  private readonly queue: RequestQueue;
  private readonly debounce = new DebounceCall();
  // temporary state while saving values are buffering
  private writeBuffer?: number;
  private writingInProgress: boolean = false;


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
    this.queue = new RequestQueue(logError, queueJobTimeoutSec);
  }

  destroy() {
    this.queue.destroy();
    this.debounce.destroy();
  }


  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return typeof this.writeBuffer !== 'undefined';
  }

  isWriting(): boolean {
    return this.writingInProgress;
  }

  async write(pin: number, value: boolean): Promise<void> {
    if (this.isWriting()) {
      // TODO: поставить в очередь - только 1  раз выполнится

      return;
    }

    if (this.writeBufferMs) {
      // collect data into buffer
      if (typeof this.writeBuffer === 'undefined') this.writeBuffer = 0;

      this.writeBuffer = updateBitInByte(this.writeBuffer, pin, value);

      this.debounce.invoke(() => {
        this.startWriting(this.writeBuffer || 0);

        delete this.writeBuffer;
      }, this.writeBufferMs, DEBOUNCE_WRITE_ID)
        .catch((e) => this.logError(e));

      return;
    }

    const stateToWrite = updateBitInByte(this.getState(), pin, value);

    // TODO: ожидать промиса конца записи
    this.startWriting(stateToWrite);
  }

  async writeState(): Promise<void> {
    const state: number = this.getState();

    // TODO: add write whole current state
    // TODO: ожидать промиса конца записи
  }

  clearPin(pin: number) {
    // TODO: add
  }


  private startWriting(state: number) {
    // TODO: ставить в очередь
    this.writingInProgress = true;

    this.writeCb(state)
      .then(() => {
        this.writingInProgress = false;
        this.currentState = state;
      })
      .catch((e: Error) => {
        this.writingInProgress = false;
        // TODO: сбрасываем очередь
        this.logError(String(e));
      });
  }

}
