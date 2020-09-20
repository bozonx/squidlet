import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../../system/interfaces/gpioTypes';
import InitIcLogic from '../../../system/lib/logic/InitIcLogic';
import {getBitFromByte, updateBitInByte} from '../../../system/lib/binaryHelpers';
import {DATA_LENGTH, PINS_COUNT} from './Pcf8574';
import DigitalExpanderDriver from './interfaces/DigitalExpanderDriver';
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';


// Count of pins which IC has
//export const PINS_COUNT = 8;


export default class DigitalExpanderLogic {
  // TODO: может лучше использовать isInited и onInit(cb)
  get initIcPromise(): Promise<void> {
    return this.initIcLogic.initPromise;
  }

  private readonly driver: DigitalExpanderDriver;
  // Direction of each pin. By default all the pin directions are undefined
  private directions: (PinDirection | undefined)[] = [];
  // collection of numbers of ms to use in debounce logic for each pin.
  private pinDebounces: {[index: string]: number} = {};
  // TODO: fill array with length of bytes
  // Bit mask representing the current state on IC of the input and outputs pins.
  private currentState: number[] = [0, 0, 0];
  private _initIcLogic?: InitIcLogic;


  private get initIcLogic(): InitIcLogic {
    return this._initIcLogic as any;
  }


  constructor(driver: DigitalExpanderDriver) {
    this.driver = driver;
  }

  init = async () => {
    this._initIcLogic = new InitIcLogic(
      (): Promise<void> => this.expanderOutput.writeState(this.currentState),
      this.log.error,
      this.config.config.requestTimeoutSec
    );

    this.initIcLogic.initPromise
      .then(() => this.startFeedback())
      .catch(this.log.error);
  }

  destroy = async () => {
    this.initIcLogic.destroy();

    delete this.directions;
    delete this.pinDebounces;
    delete this.currentState;
    delete this._initIcLogic;
  }

  // TODO: does it need public ????
  /**
   * Manually initialize IC.
   * Call this method after all the pins have been initialized and initial values are set up.
   * And you can repeat it if you setup pin after initialization.
   */
  initIc() {
    this.initIcLogic.init();
  }

  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {

    // TODO: review inputMode, debounce, edge

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

  async setupOutput(pin: number, outputInitialValue?: boolean, outputMode: OutputResistorMode): Promise<void> {

    // TODO: what to do with outputMode ???

    this.checkPinRange(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupOutput(${pin}, ${outputInitialValue}). This pin has been already set up` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.directions[pin] = PinDirection.output;

    if (typeof outputInitialValue !== 'undefined') {
      this.updateState(pin, outputInitialValue);
    }
  }

  getPinDirection(pin: number): PinDirection | undefined {
    this.checkPinRange(pin);

    return this.directions[pin];
  }

  getPinResistorMode(pin: number): OutputResistorMode | InputResistorMode | undefined {
    // TODO: add
    // TODO: проверить направление ещё
  }

  wasIcInitialized(): boolean {
    return this.initIcLogic.wasInitialized;
  }

  /**
   * Are there any input pins.
   */
  hasInputPins(): boolean {
    return this.directions.includes(PinDirection.input);
  }

  // /**
  //  * Returns array like [true, true, false, false, true, true, false, false].
  //  * It is full state includes values of input and output pins. Input pins are always true.
  //  * If you did't setup poll or interrupt then call `pollOnce()` before
  //  * to be sure that you will receive the last actual data.
  //  */
  // getState(): boolean[] {
  //   return byteToBinArr(this.currentState);
  // }

  getState = (): number[] => {
    return this.currentState;
  }

  getPinState(pin: number): boolean {
    this.checkPinRange(pin);

    // TODO: resolve byte first

    return getBitFromByte(this.currentState, pin);
  }

  // /**
  //  * Asks IC and returns the current value of a pin.
  //  * If IC hasn't been initialized then it will return false.
  //  * If pin is output then current state of this pin will be returned
  //  */
  // async read(pin: number): Promise<boolean> {
  //   this.checkPinRange(pin);
  //
  //   if (this.i2c.hasFeedback() && this.directions[pin] == PinDirection.input) {
  //     await this.pollOnce();
  //   }
  //
  //   return this.getPinState(pin);
  // }

  // /**
  //  * Set the value of an output pin.
  //  * @param  {number}  pin The pin number. (0 to 7)
  //  * @param  {boolean} value The new value for this pin.
  //  * @return {Promise}
  //  */
  // write(pin: number, value: boolean): Promise<void> {
  //   this.checkPinRange(pin);
  //
  //   if (this.directions[pin] !== PinDirection.output) {
  //     return Promise.reject(new Error('Pin is not defined as an output'));
  //   }
  //
  //   if (this.initIcLogic.isSetupStep) {
  //     // update current value of pin and go out if there is setup step
  //     this.updateState(pin, value);
  //
  //     return Promise.resolve();
  //   }
  //
  //   return this.expanderOutput.write(pin, value);
  // }

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

    // if (this.directions[pin] === PinDirection.input) {
    //   this.expanderInput.clearPin(pin);
    // }

    delete this.directions[pin];
    delete this.pinDebounces[pin];
  }

  clearAll() {
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
    // TODO: remake
    this.currentState = updateBitInByte(this.currentState, pin, value);
  }

  // private setWholeState = (state: number) => {
  //   this.currentState = state;
  // }

}
