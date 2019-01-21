/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cToSlaveDriver, I2cToSlaveDriverProps} from '../I2c/I2cToSlave.driver';
import {byteToBinArr, getBitFromByte, updateBitInByte} from '../../helpers/binaryHelpers';
import {Edge} from '../../app/interfaces/dev/Digital';
import DebounceCall from '../../helpers/DebounceCall';
import IndexedEvents from '../../helpers/IndexedEvents';


export type ChangeStateHandler = (targetPin: number, value: boolean) => void;

export interface ExpanderDriverProps extends I2cToSlaveDriverProps {
}


// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;
// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive
export const DATA_LENGTH = 1;


export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: Array<number> = [];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  private wasIcInited: boolean = false;
  private initingIcInProgress: boolean = false;
  private readonly pinEdges: {[index: string]: Edge | undefined} = {};
  private readonly pinDebounces: {[index: string]: number | undefined} = {};
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly events = new IndexedEvents<ChangeStateHandler>();

  private get i2cDriver(): I2cToSlaveDriver {
    return this.depsInstances.i2cDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cDriver = await getDriverDep('I2cToSlave.driver')
      .getInstance({
        ...this.props,
        poll: [
          {length: DATA_LENGTH}
        ],
      });
  }

  protected didInit = async () => {
    this.i2cDriver.addPollErrorListener((dataAddressStr: number | string | undefined, err: Error) => {
      this.env.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
  }

  protected devicesDidInit = async () => {
    // init IC state after app is initialized if it isn't at this moment
    try {
      await this.writeToIc(this.currentState);
    }
    catch (err) {
      this.env.log.error(`PCF8574.driver. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }


  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      this.env.log.warn(`PCF8574Driver.setupInput(${pin}, ${debounce}, ${edge}). This pin has been already set up`);

      return;
    }

    this.pinDebounces[pin] = debounce;
    this.pinEdges[pin] = edge;
    this.directions[pin] = DIR_IN;

    // set input pin to high
    this.updateCurrentState(pin, true);
  }

  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      this.env.log.warn(`PCF8574Driver.setupOutput(${pin}, ${outputInitialValue}). This pin has been already set up`);

      return;
    }

    this.directions[pin] = DIR_OUT;

    if (typeof outputInitialValue !== 'undefined') {
      this.updateCurrentState(pin, outputInitialValue);
    }
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   * Call this method inside a didInit() callback of your driver or device or after.
   */
  addListener(handler: ChangeStateHandler): number {
    return this.events.addListener(handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async pollOnce(): Promise<boolean[]> {
    if (!this.checkInitialization('poll')) return this.getState();
    else if (!this.wasIcInited) return this.getState();

    await this.i2cDriver.pollOnce();

    return this.getState();
  }

  async getPinMode(pin: number): Promise<'input' | 'output' | undefined> {
    if (this.directions[pin] === DIR_IN) {
      return 'input';
    }
    else if (this.directions[pin] === DIR_OUT) {
      return 'output';
    }

    // undefined means didn't specify
    return;
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false].
   * It is full state includes values of input and output pins.
   */
  getState(): boolean[] {
    return byteToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  async read(pin: number): Promise<boolean> {
    this.checkPin(pin);

    if (this.hasInputPins()) {
      await this.pollOnce();
    }

    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    if (!this.checkInitialization('write')) return;

    this.checkPin(pin);

    if (this.directions[pin] !== DIR_OUT) {
      throw new Error('Pin is not defined as an output');
    }

    // It doesn't need to initialize IC, because new state will send below

    //const oldValue: boolean = getBitFromByte(this.currentState, pin);
    // update local state before writing to IC
    //this.updateCurrentState(pin, value);
    // // write to IC
    // try {
    //   await this.writeToIc();
    // }
    // catch (err) {
    //   // switch back old value on error
    //   this.updateCurrentState(pin, oldValue);
    //
    //   throw new Error(err);
    // }

    const newState = updateBitInByte(this.currentState, pin, value);

    console.log('------- pcf driver write', pin, value, this.currentState, newState)

    await this.writeToIc(newState);

    // update only this pin eventually
    this.updateCurrentState(pin, value);
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: boolean[]): Promise<void> {
    if (!this.checkInitialization('writeState')) return;

    //const oldState: number = this.currentState;
    // for (let pin = 0; pin < PINS_COUNT; pin++) {
    //   // skit not an output pin
    //   if (this.directions[pin] !== DIR_OUT) continue;
    //
    //   this.updateCurrentState(pin, outputValues[pin]);
    // }

    // try {
    //   await this.writeToIc();
    // }
    // catch (err) {
    //   // switch back old value on error
    //   this.currentState = oldState;
    //
    //   throw new Error(err);
    // }

    let newState = this.currentState;

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skit not an output pin
      if (this.directions[pin] !== DIR_OUT) continue;

      newState = updateBitInByte(newState, pin, outputValues[pin]);
    }

    await this.writeToIc(newState);

    // update only output pins eventually
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skit not an output pin
      if (this.directions[pin] !== DIR_OUT) continue;

      this.updateCurrentState(pin, outputValues[pin]);
    }
  }


  private handleIcStateChange = (dataAddressStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      throw new Error(`PCF8574Driver: No data has been received`);
    }

    const oldState = this.currentState;

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', data[0].toString(2));

    // TODO: нужно ли инвертировать???

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== DIR_IN) continue;

      this.updateCurrentState(pin, getBitFromByte(data[0], pin));
    }

    this.emitChangeEvents(oldState);
  }

  /**
   * Emit event on changed input pins
   */
  private emitChangeEvents(oldState: number) {
    const oldBoolState: boolean[] = byteToBinArr(oldState);
    const currentBoolState: boolean[] = this.getState();

    for (let pinNumStr in currentBoolState) {
      const pinNum: number = parseInt(pinNumStr);

      // skip not input pins
      if (this.directions[pinNum] !== DIR_IN) continue;

      if (currentBoolState[pinNum] !== oldBoolState[pinNum]) {
        this.emitPinEvent(pinNum, currentBoolState[pinNum]);
      }
    }
  }

  private emitPinEvent(pinNum: number, pinValue: boolean) {
    // skip not suitable edge
    if (this.pinEdges[pinNum] === 'rising' && !pinValue) {
      return;
    }
    else if (this.pinEdges[pinNum] === 'falling' && pinValue) {
      return;
    }

    if (!this.pinDebounces[pinNum]) {
      this.events.emit(pinNum, pinValue);
    }
    else {
      // wait for debounce and read current level
      this.debounceCall.invoke(pinNum, this.pinDebounces[pinNum], async () => {
        const realLevel = await this.read(pinNum);

        this.events.emit(pinNum, realLevel);
      });
    }
  }

  /**
   * Write the current state to the IC.
   * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async writeToIc(newState: number) {
    if (!this.wasIcInited) {
      this.initingIcInProgress = true;
    }

    const dataToSend: Uint8Array = new Uint8Array(DATA_LENGTH);

    // send one byte to IC
    dataToSend[0] = newState;

    try {
      await this.i2cDriver.write(undefined, dataToSend);
    }
    catch (err) {
      this.initingIcInProgress = false;

      throw err;
    }

    this.initingIcInProgress = false;
    // it means that IC is inited when first data is written
    this.wasIcInited = true;
  }

  private checkInitialization(methodWhichCheck: string): boolean {
    if (this.initingIcInProgress) {
      this.env.log.warn(`PCF8574Driver.${methodWhichCheck}. IC initialization is in progress. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    else if (!this.env.system.isInitialized) {
      this.env.log.warn(`PCF8574Driver.${methodWhichCheck}. It runs before app is initialized. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    
    return true;
  }

  private checkPin(pin: number) {
    if (pin < 0 || pin >= PINS_COUNT) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  private updateCurrentState(pin: number, newValue: boolean) {
    this.currentState = updateBitInByte(this.currentState, pin, newValue);
  }

  private hasInputPins(): boolean {
    return this.directions.includes(DIR_IN);
  }


  protected validateProps = (props: ExpanderDriverProps): string | undefined => {

    // if(address < 0 || address > 255){
    //   throw new Error('Address out of range');
    // }

    return;
  }

  // /**
  //  * Helper function to set/clear one bit in a bitmask.
  //  * @param  {number}            current The current bitmask.
  //  * @param  {number}            pin     The bit-number in the bitmask.
  //  * @param  {boolean}           value   The new value for the bit. (true=set, false=clear)
  //  * @return {number}                    The new (modified) bitmask.
  //  */
  // private updatePinInBitMask(current: number, pin: number, value: boolean): number{
  //   return updateBitInByte(current, pin, value);
  // }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus || 'default'}-${props.address}`;
  }
  protected DriverClass = PCF8574Driver;
}
