import {Edge, PinDirection} from '../../../system/interfaces/gpioTypes';
import InitIcLogic from '../../../system/lib/logic/InitIcLogic';
import {getBitFromByte, updateBitInByte} from '../../../system/lib/binaryHelpers';
import {DATA_LENGTH, PINS_COUNT} from './Pcf8574';


// Count of pins which IC has
//export const PINS_COUNT = 8;


export default class DigitalExpanderLogic {
  get initIcPromise(): Promise<void> {
    return this.initIcLogic.initPromise;
  }

  // TODO: review
  private initIcLogic!: InitIcLogic;

  // Direction of each pin. By default all the pin directions are undefined
  private directions: (PinDirection | undefined)[] = [];

  // TODO: support 2 bytes and more
  // Bit mask representing the current state on IC of the input and outputs pins.
  private currentState: number[] = [0];


  init = async () => {
    // TODO: review
    this._initIcLogic = new InitIcLogic(
      (): Promise<void> => this.expanderOutput.writeState(this.currentState),
      this.log.error,
      this.config.config.requestTimeoutSec
    );

    // TODO: review
    this.initIcLogic.initPromise
      .then(() => this.startFeedback())
      .catch(this.log.error);
  }

  destroy = async () => {
    this.initIcLogic.destroy();

    delete this.directions;
    delete this.currentState;
    delete this._initIcLogic;
  }

  /**
   * Manually initialize IC.
   * Call this method after all the pins have been initialized and initial values are set up.
   * And you can repeat it if you setup pin after initialization.
   */
  initIc() {

    // TODO: why not async ???

    this.initIcLogic.init();
  }


  // TODO: review
  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPinRange(pin);

    // TODO: сделать виртуальный edge

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupInput(${pin}, ${debounce}). This pin has been already set up.` +
        `Call "clearPin()" and try to set up again`
      );
    }

    if (typeof debounce !== 'undefined') {
      this.pinDebounces[pin] = debounce;
    }

    this.directions[pin] = PinDirection.input;
  }

  // TODO: review
  async setupOutput(pin: number, initialValue?: boolean): Promise<void> {
    this.checkPinRange(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupOutput(${pin}, ${initialValue}). This pin has been already set up` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.directions[pin] = PinDirection.output;

    if (typeof initialValue !== 'undefined') {
      this.updateState(pin, initialValue);
    }
  }

  // TODO: review
  getPinDirection(pin: number): PinDirection | undefined {
    this.checkPinRange(pin);

    return this.directions[pin];
  }

  wasIcInitialized(): boolean {
    return this.initIcLogic.wasInitialized;
  }

  /**
   * Are there any input pins.
   */
  hasInputPins(): boolean {
    // TODO: лучше сохранять готовый стейт после каждого setupInput
    return this.directions.includes(PinDirection.input);
  }

  getState = (): number => {
    return this.currentState;
  }


  getPinState(pin: number): boolean {
    this.checkPinRange(pin);

    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Asks IC and returns the current value of a pin.
   * If IC hasn't been initialized then it will return false.
   * If pin is output then current state of this pin will be returned
   */
  async read(pin: number): Promise<boolean> {
    this.checkPinRange(pin);

    if (this.i2c.hasFeedback() && this.directions[pin] == PinDirection.input) {
      await this.pollOnce();
    }

    return this.getPinState(pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  write(pin: number, value: boolean): Promise<void> {
    this.checkPinRange(pin);

    if (this.directions[pin] !== PinDirection.output) {
      return Promise.reject(new Error('Pin is not defined as an output'));
    }

    if (this.initIcLogic.isSetupStep) {
      // update current value of pin and go out if there is setup step
      this.updateState(pin, value);

      return Promise.resolve();
    }

    return this.expanderOutput.write(pin, value);
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   * e.g to turn pin 0 and pin3 to high level pass 0b00001001
   */
  async writeState(newState: number): Promise<void> {
    let preparedState: number = this.currentState;

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // don't care about input pins has to be high because they will be set to high in writeToIc() method.
      if (this.directions[pin] !== PinDirection.output) continue;
      // update outputs only
      preparedState = updateBitInByte(preparedState, pin, getBitFromByte(newState, pin));
    }

    if (this.initIcLogic.isSetupStep) {
      // set current state and go out if there is setup step
      this.currentState = preparedState;

      return Promise.resolve();
    }

    await this.expanderOutput.writeState(preparedState);
  }

  clearPin(pin: number) {
    this.checkPinRange(pin);

    if (this.directions[pin] === PinDirection.input) {
      this.expanderInput.clearPin(pin);
    }

    delete this.directions[pin];
    delete this.pinDebounces[pin];
  }

  clearAll() {
    this.expanderInput.cancel();
    this.expanderOutput.cancel();

    for (let pin = 0; pin < PINS_COUNT; pin ++) {
      delete this.directions[pin];
      delete this.pinDebounces[pin];
    }
  }

  /**
   * Write given state to the IC.
   */
  private writeToIc = (newStateByte: number): Promise<void> => {
    let preparedState: number = newStateByte;

    if (this.hasInputPins()) {
      for (let pin = 0; pin < PINS_COUNT; pin++) {
        if (this.directions[pin] !== PinDirection.input) continue;
        // set height level for inputs. It needs for PCF IC
        preparedState = updateBitInByte(preparedState, pin, true);
      }
    }

    const dataToSend: Uint8Array = new Uint8Array(DATA_LENGTH);
    // fill data
    dataToSend[0] = preparedState;

    return this.i2c.write(dataToSend);
  }

  private checkPinRange(pin: number) {
    if (pin < 0 || pin >= PINS_COUNT) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  /**
   * Just update state and don't save it to IC
   */
  private updateState = (pin: number, value: boolean) => {
    this.currentState = updateBitInByte(this.currentState, pin, value);
  }

  private setWholeState = (state: number) => {
    this.currentState = state;
  }

}
