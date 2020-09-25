import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../lib/IndexedEventEmitter';
import {getBitFromByte} from '../../lib/binaryHelpers';
import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';


interface InputPinProps {
  resistor: InputResistorMode;
  debounce?: number;
  edge?: Edge;
}


export default class DigitalExpanderInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  // change events of input pins
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounce = new DebounceCall();
  private state: {[index: string]: boolean} = {};
  private pinProps: {[index: string]: InputPinProps} = {};


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>
  ) {
    // TODO: зачем он нужен ?????
    this.logError = logError;

    // TODO: зачем он нужен ?????
    this.pollOnce = pollOnce;
  }

  destroy() {
    this.events.destroy();
    this.debounce.destroy();

    delete this.state;
    delete this.pinProps;
  }


  /**
   * To use debounce at microcontroller side set debounce to 0.
   * @param pin
   * @param resistor
   * @param debounce
   * @param edge
   */
  setupPin(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ) {
    this.pinProps[pin] = {
      resistor,
      debounce,
      edge,
    };
  }

  getState(): {[index: string]: boolean} {
    return this.state;
  }

  /**
   * Listen to changes of pin after debounce was processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.events.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }

  /**
   * Handle driver's income message
   * State which is income after poling request.
   * More than one pin can be changed.
   */
  handleIncomeState = (pin: number, newState: {[index: string]: boolean}) => {
    // handle logic of all the changed pins
    for (let pin of Object.keys(newState)) {
      // TODO: а если идет debounce??? то нет смысла обрабатывать
      // Don't handle not changed pins.
      // It means they not changed but was delivered on poll.
      if (newState[pin] === this.state[pin]) continue;

      this.handleChangedPin(parseInt(pin), newState[pin]);
    }
  }

  /**
   * It just clears debounce and handlers of pin
   */
  clearPin(pin: number) {
    // TODO: review
    if (this.polledPinsBuffer) delete this.polledPinsBuffer[pin];

    this.events.removeAllListeners(pin);
    this.debounce.clear(pin);
  }

  cancel() {
    // TODO: review
    this.debounce.clearAll();

    delete this.pollPromise;
    // it means don't handle poll result
    delete this.polledPinsBuffer;
  }


  /**
   * Handle pin which has been changed and isn't in debounce progress.
   */
  private handleChangedPin(pin: number, newValue: boolean) {
    if (!this.pinProps[pin]) {
      throw new Error(`Pin "${pin}" hasn't been set up.`);
    }

    const debounce: number = this.pinProps[pin].debounce || 0;
    // make debounced call if it was set
    if (debounce > 0) {
      // wait for debounce and after than read current level
      this.debounce.invoke(() => {
        // TODO: почему не дожидаемся окончания ???
        this.handleEndOfDebounce(pin)
          .catch(this.logError);
      }, debounce, pin)
        .catch(this.logError);

      return;
    }

    // TODO: start debounce and after that use edge logic


    // else emit right now if there isn't any debounce
    // clear debounce if set
    if (this.debounce.isInvoking(pin)) this.debounce.clear(pin);
    // set a new value
    this.updateState(pin, newValue);

    // TODO: handle edge

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

    // TODO: handle edge

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


// /**
//  * Is debounce in propgress of poll in propress
//  * @param pin
//  */
// isInProgress(pin: number) {
//   return this.debounce.isInvoking(pin) || this.isPollInProgress();
// }
