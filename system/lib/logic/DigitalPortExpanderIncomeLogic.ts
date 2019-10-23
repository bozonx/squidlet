import RequestQueue from '../RequestQueue';
import DebounceCall from '../debounceCall/DebounceCall';
import {ChangeHandler} from '../../interfaces/io/DigitalIo';
import IndexedEventEmitter from '../IndexedEventEmitter';


export default class DigitalPortExpanderIncomeLogic {
  private readonly logError: (msg: string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly queue: RequestQueue;
  private readonly debounce = new DebounceCall();
  // Bitmask representing the current state of the pins
  //private currentState: number = 0;
  // buffer by pin for input pins while debounce or poll are in progress
  private inputPinBuffer: {[index: string]: boolean} = {};
  // change events of input pins
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();


  constructor(
    logError: (msg: string) => void,
    pollOnce: () => Promise<void>,
    queueJobTimeoutSec: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.queue = new RequestQueue(logError, queueJobTimeoutSec);
  }

  destroy() {
    // TODO: add !!!!
  }


  // getState(): number {
  //   return this.currentState;
  // }

  isInputBuffering(pin: number) {
    return typeof this.inputPinBuffer[pin] !== 'undefined';
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

  // /**
  //  * Just update state and don't save it to IC
  //  */
  // updateState(pin: number, value: boolean) {
  //   this.currentState = updateBitInByte(this.currentState, pin, value);
  // }
  //
  // setWholeState(state: number) {
  //   this.currentState = state;
  // }

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
