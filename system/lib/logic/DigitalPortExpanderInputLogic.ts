import DebounceCall from '../debounceCall/DebounceCall';
import {ChangeHandler} from '../../interfaces/io/DigitalIo';
import IndexedEventEmitter from '../IndexedEventEmitter';
import {Edge} from '../../interfaces/gpioTypes';
import {getBitFromByte} from '../binaryHelpers';
import QueueOverride from '../QueueOverride';


export default class DigitalPortExpanderInputLogic {
  private readonly logError: (msg: string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly getState: () => number;
  private readonly updateState: (pin: number, value: boolean) => void;
  private readonly queue = new QueueOverride();
  private readonly debounce = new DebounceCall();
  // buffer by pin for input pins while debounce or poll are in progress
  private inputPinBuffer: {[index: string]: boolean} = {};
  // change events of input pins
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();


  constructor(
    logError: (msg: string) => void,
    pollOnce: () => Promise<void>,
    getState: () => number,
    updateState: (pin: number, value: boolean) => void,
    //queueJobTimeoutSec: number,
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.getState = getState;
    this.updateState = updateState;
  }

  destroy() {
    // TODO: add !!!!
  }


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

  /**
   * State which is income after poling request.
   */
  incomeState(pin: number, newValue: boolean, debounceMs?: number, edge?: Edge) {
    // skip not suitable edge
    if (edge === Edge.rising && !newValue) {
      return;
    }
    else if (edge === Edge.falling && newValue) {
      return;
    }

    if (edge === Edge.rising || edge === Edge.falling) {
      // TODO: если edge falling or rising - то схема будет упрощенной
      //   просто throttle и poll не нужен

      return;
    }
    // else edge both

    // If not changed = nothing happened.
    if (newValue === getBitFromByte(this.getState(), pin)) return;

    // if value was changed then update state and rise an event.
    this.handleIncomeState(pin, newValue, debounceMs);
  }

  clearPin(pin: number) {
    // TODO: add - rename to cancel ???
  }


  /**
   * Handle income state for edge both.
   */
  private handleIncomeState(pin: number, newValue: boolean, debounceMs?: number) {
    // TODO: зачем ????
    const isBuffering: boolean = this.isInputBuffering(pin);

    // TODO: review
    this.inputPinBuffer[pin] = newValue;

    // debounce or polling are in progress - just update the last value
    if (isBuffering) return;
    // else start debounce on first time
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
