import DebounceCall from '../debounceCall/DebounceCall';
import {ChangeHandler} from '../../interfaces/io/DigitalIo';
import IndexedEventEmitter from '../IndexedEventEmitter';
import {getBitFromByte} from '../binaryHelpers';


export default class DigitalPortExpanderInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly getState: () => number;
  private readonly updateState: (pin: number, value: boolean) => void;
  private readonly debounce = new DebounceCall();
  // promise while poll is in progress
  private pollPromise?: Promise<void>;
  // there are stored pins which are changed while polling
  private polledPinsBuffer?: {[index: string]: boolean};
  // change events of input pins
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>,
    getState: () => number,
    updateState: (pin: number, value: boolean) => void,
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.getState = getState;
    this.updateState = updateState;
  }

  destroy() {
    this.debounce.destroy();
    this.changeEvents.destroy();

    delete this.pollPromise;
    delete this.polledPinsBuffer;
  }


  isInProgress(pin: number) {
    return this.debounce.isInvoking(pin) || this.isPollInProgress();
  }

  isPollInProgress(): boolean {
    return Boolean(this.pollPromise);
  }

  /**
   * Listen to changes of pin after debounce was processed.
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
  incomeState(pin: number, newValue: boolean, debounceMs?: number) {
    // save value to the buffer if poling is in progress
    if (this.isPollInProgress()) {
      if (!this.polledPinsBuffer) {
        return this.logError(`No polledPinsBuffer`);
      }

      this.polledPinsBuffer[pin] = newValue;

      return;
    }

    // else first time or at debounce time.
    // If not changed = nothing happened. It needs because we don't exactly know which pin is changed.
    if (newValue === getBitFromByte(this.getState(), pin)) return;

    // if value was changed then update state and rise an event.
    this.handleIncomeState(pin, newValue, debounceMs);
  }

  clearPin(pin: number) {
    this.debounce.clear(pin);
  }

  cancel() {
    this.debounce.clearAll();

    delete this.pollPromise;
    delete this.polledPinsBuffer;
  }


  /**
   * Handle income state
   */
  private handleIncomeState(pin: number, newValue: boolean, debounceMs?: number) {
    // make debounced call
    if (debounceMs) {
      // wait for debounce and read current level
      this.debounce.invoke(() => {
        this.handleEndOfDebounce(pin)
          .catch(this.logError);
      }, debounceMs, pin)
        .catch(this.logError);
    }
    else {
      // emit right now if there isn't debounce
      // clear debounce if set
      if (this.debounce.isInvoking(pin)) this.debounce.clear(pin);
      // set a new value
      this.updateState(pin, newValue);
      // rise a new event even value hasn't been actually changed since first check
      this.changeEvents.emit(pin, newValue);
    }
  }

  /**
   * It is only the first one callback of debounce cycle.
   */
  private async handleEndOfDebounce(pin: number) {
    this.polledPinsBuffer = {};

    // TODO: нужно удостовериться что сначала выполнились все обработчики которые вызывают incomeState()
    try {
      this.pollPromise = this.pollOnce();

      await this.pollPromise;
    }
    catch (e) {
      delete this.pollPromise;
      delete this.polledPinsBuffer;

      throw e;
    }

    // means that pall has been canceled
    if (!this.polledPinsBuffer) return;

    const stateBeforePolling: number = this.getState();

    // set all the values which has been received via last poll
    for (let pinStr of Object.keys(this.polledPinsBuffer)) {
      if (getBitFromByte(stateBeforePolling, pin) === this.polledPinsBuffer[pinStr]) continue;

      // set a new value
      this.updateState(Number(pinStr), this.polledPinsBuffer[pinStr]);
      // rise a new event even value hasn't been actually changed since first check
      this.changeEvents.emit(Number(pinStr), this.polledPinsBuffer[pinStr]);
    }

    delete this.pollPromise;
    delete this.polledPinsBuffer;
  }

}
