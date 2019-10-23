/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {byteToBinArr, getBitFromByte, updateBitInByte} from 'system/lib/binaryHelpers';
import {Edge, PinDirection} from 'system/interfaces/gpioTypes';
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {omitObj} from 'system/lib/objects';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';
import DigitalPortExpanderIncomeLogic from '../../../system/lib/logic/DigitalPortExpanderIncomeLogic';
import DigitalPortExpanderOutcomeLogic from '../../../system/lib/logic/DigitalPortExpanderOutcomeLogic';


export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
  writeBufferMs?: number;
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: (PinDirection | undefined)[] = [];
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcStep: boolean = false;
  // collection of numbers of ms to use in debounce logic for each pin.
  private readonly pinDebounces: {[index: string]: number} = {};
  // collection of edges values of each pin to use in change handler
  private readonly pinEdges: {[index: string]: Edge | undefined} = {};
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  private _expanderOutput?: DigitalPortExpanderOutcomeLogic;
  private _expanderInput?: DigitalPortExpanderIncomeLogic;

  private get i2cDriver(): I2cToSlave {
    return this.depsInstances.i2cDriver;
  }

  private get expanderOutput(): DigitalPortExpanderOutcomeLogic {
    return this._expanderOutput as any;
  }

  private get expanderInput(): DigitalPortExpanderIncomeLogic {
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

    this._expanderOutput = new DigitalPortExpanderOutcomeLogic(
      this.log.error,
      this.writeToIc,
      (): number => this.currentState,
      this.updateState,
      this.config.config.queueJobTimeoutSec,
      this.props.writeBufferMs
    );
    this._expanderInput = new DigitalPortExpanderIncomeLogic(
      this.log.error,
      this.pollOnce,
      (): number => this.currentState,
      this.updateState,
      this.config.config.queueJobTimeoutSec,
    );
  }

  destroy = async () => {
    // TODO: add
  }

  // protected appDidInit = async () => {
  //   // init IC state after app is initialized if it isn't at this moment
  //   try {
  //     await this.writeToIc(this.currentState);
  //   }
  //   catch (err) {
  //     this.log.error(`PCF8574. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
  //   }
  // }

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
      // TODO: использовать expander write чтобы образовалась очередь ???
      await this.writeToIc(this.currentState);
    }
    catch (e) {
      this.initIcStep = false;

      throw e;
    }
    // if I2C driver doesn't have feedback then it doesn't need to be setup
    if (!this.i2cDriver.hasFeedback()) return;

    // TODO: review - почему бы это не сделать в самом i2cDriver ?
    this.i2cDriver.addPollErrorListener((functionStr: number | string | undefined, err: Error) => {
      this.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
    // make first request and start handle feedback
    this.i2cDriver.startFeedback();

    this.initIcStep = false;
  }


  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupInput(${pin}, ${debounce}, ${edge}). This pin has been already set up.` +
        `Call "clearPin()" and try to set up again`
      );
    }

    if (typeof debounce !== 'undefined') {
      this.pinDebounces[pin] = debounce;
    }

    this.pinEdges[pin] = edge;
    this.directions[pin] = PinDirection.input;

    // set input pin to high
    this.updateState(pin, true);
  }

  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
    this.checkPin(pin);

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
    return this.directions[pin];
  }

  isIcInitialized(): boolean {
    return !this.setupStep && !this.initIcStep;
  }

  /**
   * Are there any input pins.
   */
  hasInputPins(): boolean {
    return this.directions.includes(PinDirection.input);
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.expanderInput.onChange(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.expanderInput.removeListener(handlerIndex);
  }

  /**
   * Poll expander manually.
   */
  pollOnce = (): Promise<void> => {
    // TODO: вернуть промис полной IC инициализации
    // there is no need to do poll before initialization because after initialization it will be done
    if (!this.isIcInitialized()) return Promise.resolve();

    return this.i2cDriver.pollOnce();
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false].
   * It is full state includes values of input and output pins. Input pins are always true.
   * If you did't setup poll or interrupt then call `pollOnce()` before
   * to be sure that you will receive the last actual data.
   */
  getState(): boolean[] {
    return byteToBinArr(this.currentState);
  }

  getPinState(pin: number): boolean {
    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Asks IC and returns the current value of a pin.
   */
  async read(pin: number): Promise<boolean> {
    this.checkPin(pin);

    if (this.i2cDriver.hasFeedback()) {
      // TODO: как удостовериться что после poll отработают хэндлеры которые установят стейт
      await this.pollOnce();
    }

    return this.getPinState(pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    this.checkPin(pin);

    if (this.directions[pin] !== PinDirection.output) {
      throw new Error('Pin is not defined as an output');
    }

    if (this.setupStep) {
      // update current value of pin and go out if there is setup step
      this.updateState(pin, value);
      // TODO: ожидать промиса конца полной инициализации
      return;
    }
    // TODO: ожидать промиса конца записи
    this.expanderOutput.write(pin, value);
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: (boolean | undefined)[]): Promise<void> {
    let newState: number = this.currentState;

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip undefined values and not an output pin
      if (typeof outputValues[pin] !== 'boolean' || this.directions[pin] !== PinDirection.output) continue;

      newState = updateBitInByte(newState, pin, outputValues[pin] as boolean);
    }

    if (this.setupStep) {
      // set current state and go out if there is setup step
      this.currentState = newState;
      // TODO: ожидать промиса конца полной инициализации
      return;
    }
    // TODO: ожидать промиса конца записи
    this.expanderOutput.writeState();
  }

  clearPin(pin: number) {
    // TODO: add
  }

  clearAll() {
    for (let pin = 0; pin < PINS_COUNT; pin ++) {
      this.clearPin(pin);
    }
  }


  private handleIcStateChange = (functionStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
    }

    this.setNewInputsStates(data[0]);
  }

  private setNewInputsStates(receivedByte: number) {
    // update values add rise change event of input pins which are changed
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;

      const newValue: boolean = getBitFromByte(receivedByte, pin);

      this.expanderInput.incomeState(pin, newValue, this.pinDebounces[pin], this.pinEdges[pin]);
    }
  }

  /**
   * Write given state to the IC.
   */
  private writeToIc = (newStateByte: number): Promise<void> => {
    const dataToSend: Uint8Array = new Uint8Array(DATA_LENGTH);
    // fill data
    dataToSend[0] = newStateByte;

    return this.i2cDriver.write(undefined, dataToSend);
  }

  // TODO: решить на каком уровне делать
  // TODO: использовать board setup
  private checkPin(pin: number) {
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
