import RequestQueue from '../../../system/lib/RequestQueue';
import {getBitFromByte, updateBitInByte} from '../../../system/lib/binaryHelpers';
import DebounceCall from '../../../system/lib/debounceCall/DebounceCall';
import {ChangeHandler} from '../../../system/interfaces/io/DigitalIo';
import IndexedEventEmitter from '../../../system/lib/IndexedEventEmitter';


const DEBOUNCE_WRITE_ID = 'write';


// TODO: может сделать поддержку 16 bit ?


export default class ExpanderLogic {
  private readonly logError: (msg: string) => void;
  private readonly writeCb: (state: number) => Promise<void>;
  private readonly pollOnce: () => Promise<void>;
  private readonly writeBufferMs?: number;
  private readonly queue: RequestQueue;
  private readonly debounce = new DebounceCall();
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  // temporary state while saving values are buffering
  private writeBuffer?: number;
  // buffer by pin for input pins while debounce or poll are in progress
  private inputPinBuffer: {[index: string]: boolean} = {};
  private writingInProgress: boolean = false;
  // change events of input pins
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();


  constructor(
    logError: (msg: string) => void,
    writeCb: (state: number) => Promise<void>,
    pollOnce: () => Promise<void>,
    queueJobTimeoutSec: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.pollOnce = pollOnce;
    this.queue = new RequestQueue(logError, queueJobTimeoutSec);
    this.writeBufferMs = writeBufferMs;
  }

  destroy() {
    // TODO: add !!!!
  }


  getState(): number {
    return this.currentState;
  }

  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return typeof this.writeBuffer !== 'undefined';
  }

  isInputBuffering(pin: number) {
    return typeof this.inputPinBuffer[pin] !== 'undefined';
  }

  isWriting(): boolean {
    return this.writingInProgress;
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.changeEvents.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Just update state and don't save it to IC
   */
  updateState(pin: number, value: boolean) {
    this.currentState = updateBitInByte(this.currentState, pin, value);
  }

  setWholeState(state: number) {
    this.currentState = state;
  }

  /**
   * State which is income after poling request.
   */
  incomeState(pin: number, value: boolean, debounceMs?: number) {
    const isBuffering: boolean = this.isInputBuffering(pin);

    this.inputPinBuffer[pin] = value;

    // debounce or polling are in progress - just update the last value
    if (isBuffering) return;

    if (debounceMs) {
      // wait for debounce and read current level
      this.debounce.invoke(() => {
        this.handleEndOfDebounce(pin);
      }, debounceMs, pin)
        .catch((e: Error) => this.logError(String(e)));
    }
    else {
      // TODO: не делать poll
      // TODO: очистить debounce если есть
      // emit right now if there isn't debounce
      this.handleEndOfDebounce(pin);
    }
  }

  write(pin: number, value: boolean) {
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

    const stateToWrite = updateBitInByte(this.currentState, pin, value);

    // TODO: нужно ли ожидать???
    this.startWriting(stateToWrite);
  }

  writeState() {
    // TODO: add write whole current state
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

  /**
   * It is only the first one callback of debounce cycle.
   */
  private handleEndOfDebounce(pin: number) {
    // TODO: нужно накапливать запросы poll и если в процессе были новые то делать ещё 1 запрос

    // start polling
    this.pollOnce()
      .then(() => {
        // TODO: как удосторевиться что выполнились обработчики и теперь this.inputPinBuffer[pin] верный???

        const lastValue = this.inputPinBuffer[pin];

        delete this.inputPinBuffer[pin];
        // set a new value
        this.updateState(pin, lastValue);
        // rise a new event even value hasn't been actually changed since first check
        this.changeEvents.emit(pin, lastValue);
      })
      .catch((e: Error) => {
        // on error we can't certainly recognize the value because of that not rise an event.
        delete this.inputPinBuffer[pin];
        this.logError(String(e));
      });
  }

}
