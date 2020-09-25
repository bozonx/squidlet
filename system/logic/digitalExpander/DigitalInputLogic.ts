import DigitalInputIo, {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../lib/IndexedEventEmitter';
import {getBitFromByte} from '../../lib/binaryHelpers';
import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';


export default class DigitalInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  //private readonly updateState: (pin: number, value: boolean) => void;
  // promise while poll is in progress
  private pollPromise?: Promise<void>;
  // there are stored pins which are changed while polling
  private polledPinsBuffer?: {[index: string]: boolean};
  // change events of input pins
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounce = new DebounceCall();


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
  }

  destroy() {
    this.events.destroy();
    this.debounce.destroy();

    delete this.pollPromise;
    delete this.polledPinsBuffer;
  }


  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ): Promise<void> {
    // TODO: do it
  }

  getState(): {[index: string]: boolean} {
    // TODO: do it
  }

  isInProgress(pin: number) {
    return this.debounce.isInvoking(pin) || this.isPollInProgress();
  }

  isPollInProgress(): boolean {
    return Boolean(this.pollPromise);
  }

  /**
   * Handle driver's income message
   * @param pin
   * @param newState
   */
  handleIncomeState = (pin: number, newState: {[index: string]: boolean}) => {

  }

  // /**
  //  * Listen to changes of pin after debounce was processed.
  //  */
  // onChange(pin: number, handler: ChangeHandler): number {
  //   return this.events.addListener(pin, handler);
  // }
  //
  // removeListener(handlerIndex: number) {
  //   this.events.removeListener(handlerIndex);
  // }

  /**
   * State which is income after poling request.
   * This method will be called at any request as many times as pins count
   */
  incomeState(pin: number, newValue: boolean, debounceMs?: number) {
    // save the most actual value to the buffer
    // if poling for the actual values is in progress
    if (this.isPollInProgress()) {
      if (!this.polledPinsBuffer) return this.logError(`No polledPinsBuffer`)

      this.polledPinsBuffer[pin] = newValue;

      return;
    }

    // else it is the first time or debounce time.
    // If not changed = nothing happened.
    // It needs because we don't exactly know which pin is changed.
    if (newValue === getBitFromByte(this.getState(), pin)) return;

    // if value was changed then update state and rise an event.
    this.handleIncomeState(pin, newValue, debounceMs);
  }

  /**
   * It just clears debounce and handlers of pin
   */
  clearPin(pin: number) {
    if (this.polledPinsBuffer) delete this.polledPinsBuffer[pin];

    this.events.removeAllListeners(pin);
    this.debounce.clear(pin);
  }

  cancel() {
    this.debounce.clearAll();

    delete this.pollPromise;
    // it means don't handle poll result
    delete this.polledPinsBuffer;
  }


  /**
   * Handle income state.
   * For first change of change at debounce time.
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

      return;
    }

    // else emit right now if there isn't any debounce
    // clear debounce if set
    if (this.debounce.isInvoking(pin)) this.debounce.clear(pin);
    // set a new value
    this.updateState(pin, newValue);
    // rise a new event even value hasn't been actually changed since first check
    this.events.emit(pin, newValue);
  }

  /**
   * While debounce is in progress all other requests are ignored.
   * When debounce is finished then the confirmations is started.
   */
  private async handleEndOfDebounce(pin: number) {
    // TODO: что если этот буфер уже был создан ????
    // TODO: поидее другие пины должны дождаться ответа
    // TODO: после pollOnce НЕ вызывается incomeState

    // TODO: review может спокойно запускать новый poll - может там очередь отрабатывает

    // If poll is in progress then just wait for poll is finished
    if (this.polledPinsBuffer) {
      await this.pollPromise;
    }
    // It there isn't any poll then make a new one
    else {
      this.polledPinsBuffer = {};

      try {
        this.pollPromise = this.pollOnce();

        await this.pollPromise;
      }
      catch (e) {
        delete this.pollPromise;
        delete this.polledPinsBuffer;

        throw e;
      }
    }

    this.setFinalState(pin);
  }

  private setFinalState(pin: number) {
    // means that poll has been canceled
    if (!this.polledPinsBuffer) return;

    // old state
    const stateBeforePoll: number = this.getState();

    // set all the values which has been received via last poll
    for (let pinStr of Object.keys(this.polledPinsBuffer)) {
      if (getBitFromByte(stateBeforePoll, pin) === this.polledPinsBuffer[pinStr]) continue;

      // set a new value
      this.updateState(Number(pinStr), this.polledPinsBuffer[pinStr]);
      // rise a new event even value hasn't been actually changed since first check
      this.events.emit(Number(pinStr), this.polledPinsBuffer[pinStr]);
    }

    delete this.pollPromise;
    delete this.polledPinsBuffer;
  }

  ////////////////// FROM driver

  // /**
  //  * Listen to changes of pin after edge and debounce were processed.
  //  */
  // onChange(pin: number, handler: ChangeHandler): number {
  //   this.checkPinRange(pin);
  //
  //   return this.expanderInput.onChange(pin, handler);
  // }
  //
  // removeListener(handlerIndex: number) {
  //   this.expanderInput.removeListener(handlerIndex);
  // }
  //
  // /**
  //  * Poll expander manually.
  //  */
  // pollOnce = (): Promise<void> => {
  //   // it is no need to do poll while initialization time because it will be done after initialization
  //   if (!this.initIcLogic.wasInitialized) return Promise.resolve();
  //
  //   return this.i2c.pollOnce();
  // }
  //
  // private startFeedback() {
  //   // if I2C driver doesn't have feedback then it doesn't need to be setup
  //   if (!this.i2c.hasFeedback()) return;
  //
  //   this.i2c.addListener(this.handleIcStateChange);
  //   // make first request and start handle feedback
  //   this.i2c.startFeedback();
  // }
  //
  // private handleIcStateChange = (data: Uint8Array) => {
  //
  //   console.log('------- handleIcStateChange ---------', data)
  //
  //   if (!data || data.length !== DATA_LENGTH) {
  //     return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
  //   }
  //
  //   const receivedByte: number = data[0];
  //
  //   // update values add rise change event of input pins which are changed
  //   for (let pin = 0; pin < PINS_COUNT; pin++) {
  //     // skip not input pins
  //     if (this.directions[pin] !== PinDirection.input) continue;
  //
  //     const newValue: boolean = getBitFromByte(receivedByte, pin);
  //
  //     this.expanderInput.incomeState(pin, newValue, this.pinDebounces[pin]);
  //   }
  // }

}
