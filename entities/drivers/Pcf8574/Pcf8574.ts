/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {getBitFromByte, updateBitInByte} from 'system/lib/binaryHelpers';
import {PinDirection} from 'system/interfaces/gpioTypes';
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {omitObj} from 'system/lib/objects';
import DigitalPortExpanderInputLogic from 'system/lib/logic/DigitalPortExpanderInputLogic';
import DigitalPortExpanderOutputLogic from 'system/lib/logic/DigitalPortExpanderOutputLogic';
import Promised from 'system/lib/Promised';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';


export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
  writeBufferMs?: number;
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  get initIcPromise(): Promise<void> {
    return this.initIcPromised.promise;
  }

  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: (PinDirection | undefined)[] = [];
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcStep: boolean = false;
  private initIcPromised = new Promised<void>();
  // collection of numbers of ms to use in debounce logic for each pin.
  private readonly pinDebounces: {[index: string]: number} = {};
  // Bit mask representing the current state on IC of the input and outputs pins.
  private currentState: number = 0;
  private _expanderOutput?: DigitalPortExpanderOutputLogic;
  private _expanderInput?: DigitalPortExpanderInputLogic;

  private get i2cDriver(): I2cToSlave {
    return this.depsInstances.i2cDriver;
  }

  private get expanderOutput(): DigitalPortExpanderOutputLogic {
    return this._expanderOutput as any;
  }

  private get expanderInput(): DigitalPortExpanderInputLogic {
    return this._expanderInput as any;
  }


  init = async () => {
    this.depsInstances.i2cDriver = await this.context.getSubDriver(
      'I2cToSlave',
      {
        ...omitObj(this.props, 'writeBufferMs'),
        // TODO: review
        poll: [
          {length: DATA_LENGTH}
        ],
      }
    );

    this._expanderOutput = new DigitalPortExpanderOutputLogic(
      this.log.error,
      this.writeToIc,
      this.getState,
      this.setWholeState,
      this.config.config.queueJobTimeoutSec,
      this.props.writeBufferMs,
    );
    this._expanderInput = new DigitalPortExpanderInputLogic(
      this.log.error,
      this.pollOnce,
      this.getState,
      this.updateState,
    );
  }

  destroy = async () => {
    this.initIcPromised.destroy();
    this.expanderInput.destroy();
    this.expanderOutput.destroy();
  }

  /**
   * Manually initialize IC.
   * Call this method after all the pins have been initialized and initial values are set up.
   * And you can repeat it if you setup pin after initialization.
   */
  async initIc() {
    // mark end of setup step
    this.setupStep = false;
    this.initIcStep = true;

    try {
      await this.expanderOutput.writeState(this.currentState);
    }
    catch (e) {
      this.initIcStep = false;

      // TODO: если произолша ошибка - как тогда потом проинициализироваться ????

      this.initIcPromised.reject(e);

      throw e;
    }

    this.initIcStep = false;

    this.initIcPromised.resolve();

    this.startFeedback();
  }

  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(pin: number, debounce?: number): Promise<void> {
    this.checkPinRange(pin);

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

  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
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

  isIcInitialized(): boolean {
    return !this.setupStep && !this.initIcStep;
  }

  /**
   * Are there any input pins.
   */
  hasInputPins(): boolean {
    // TODO: лучше сохранять готовый стейт после каждого setupInput
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

  getState = (): number => {
    return this.currentState;
  }

  getPinState(pin: number): boolean {
    this.checkPinRange(pin);

    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    this.checkPinRange(pin);

    return this.expanderInput.onChange(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.expanderInput.removeListener(handlerIndex);
  }

  /**
   * Poll expander manually.
   */
  pollOnce = (): Promise<void> => {
    // it is no need to do poll while initialization time because it will be done after initialization
    if (!this.isIcInitialized()) return Promise.resolve();

    return this.i2cDriver.pollOnce();
  }

  /**
   * Asks IC and returns the current value of a pin.
   * If IC hasn't been initialized then it will return false.
   * If pin is output then current state of this pin will be returned
   */
  async read(pin: number): Promise<boolean> {
    this.checkPinRange(pin);

    if (this.i2cDriver.hasFeedback() && this.directions[pin] == PinDirection.input) {
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

    if (this.setupStep) {
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

    if (this.setupStep) {
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


  private startFeedback() {
    // if I2C driver doesn't have feedback then it doesn't need to be setup
    if (!this.i2cDriver.hasFeedback()) return;

    // TODO: review - почему бы это не сделать в самом i2cDriver ?
    this.i2cDriver.addPollErrorListener((functionStr: number | string | undefined, err: Error) => {
      this.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
    // make first request and start handle feedback
    this.i2cDriver.startFeedback();
  }

  private handleIcStateChange = (functionStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
    }

    const receivedByte: number = data[0];

    // update values add rise change event of input pins which are changed
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;

      const newValue: boolean = getBitFromByte(receivedByte, pin);

      this.expanderInput.incomeState(pin, newValue, this.pinDebounces[pin]);
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

    return this.i2cDriver.write(undefined, dataToSend);
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


export default class Factory extends DriverFactoryBase<Pcf8574, Pcf8574ExpanderProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: Pcf8574ExpanderProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
