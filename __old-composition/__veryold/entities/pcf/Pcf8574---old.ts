/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'src/base/DriverFactoryBase';
import DriverBase from 'src/base/DriverBase';
import {getBitFromByte, updateBitInByte} from '../squidlet-lib/src/binaryHelpers';
import {PinDirection} from '__old/system/interfaces/gpioTypes';
import {ChangeHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import {omitObj} from '../squidlet-lib/src/objects';
import DigitalPortExpanderInputLogic from 'system/lib/logic/DigitalExpanderInputLogic';
import DigitalPortExpanderOutputLogic from 'system/lib/logic/DigitalExpanderOutputLogic';
import InitIcLogic from 'system/lib/logic/InitIcLogic';
import {I2cMaster, I2cMasterDriverProps} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/I2cMaster/I2cMaster.js';


export interface Pcf8574ExpanderProps extends I2cMasterDriverProps {
  writeBufferMs?: number;
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  get initIcPromise(): Promise<void> {
    return this.initIcLogic.initPromise;
  }

  // Direction of each pin. By default all the pin directions are undefined
  private directions: (PinDirection | undefined)[] = [];
  // collection of numbers of ms to use in debounce logic for each pin.
  private pinDebounces: {[index: string]: number} = {};
  // Bit mask representing the current state on IC of the input and outputs pins.
  private currentState: number = 0;
  private _initIcLogic?: InitIcLogic;
  private _expanderOutput?: DigitalPortExpanderOutputLogic;
  private _expanderInput?: DigitalPortExpanderInputLogic;

  private get i2c(): I2cMaster {
    return this.depsInstances.i2c;
  }

  private get initIcLogic(): InitIcLogic {
    return this._initIcLogic as any;
  }

  private get expanderOutput(): DigitalPortExpanderOutputLogic {
    return this._expanderOutput as any;
  }

  private get expanderInput(): DigitalPortExpanderInputLogic {
    return this._expanderInput as any;
  }


  init = async () => {
    this.depsInstances.i2c = await this.context.getSubDriver(
      'I2cMaster',
      {
        ...omitObj(this.props, 'writeBufferMs'),
        poll: [
          {
            // TODO: don't use it
            request: new Uint8Array(0),
            resultLength: DATA_LENGTH
          },
        ],
      }
    );

    this._initIcLogic = new InitIcLogic(
      (): Promise<void> => this.expanderOutput.writeState(this.currentState),
      this.log.error,
      this.config.config.requestTimeoutSec
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

    this.initIcLogic.initPromise
      .then(() => this.startFeedback())
      .catch(this.log.error);
  }

  destroy = async () => {
    this.initIcLogic.destroy();
    this.expanderInput.destroy();
    this.expanderOutput.destroy();

    delete this.directions;
    delete this.pinDebounces;
    delete this.currentState;
    delete this._initIcLogic;
    delete this._expanderOutput;
    delete this._expanderInput;
  }

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
  async setupInput(pin: number, debounce?: number): Promise<void> {
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
    if (!this.initIcLogic.wasInitialized) return Promise.resolve();

    return this.i2c.pollOnce();
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


  private startFeedback() {
    // if I2C driver doesn't have feedback then it doesn't need to be setup
    if (!this.i2c.hasFeedback()) return;

    this.i2c.addListener(this.handleIcStateChange);
    // make first request and start handle feedback
    this.i2c.startFeedback();
  }

  private handleIcStateChange = (data: Uint8Array) => {

    console.log('------- handleIcStateChange ---------', data)

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


export default class Factory extends DriverFactoryBase<Pcf8574, Pcf8574ExpanderProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: Pcf8574ExpanderProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
