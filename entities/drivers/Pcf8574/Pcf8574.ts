/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {GetDriverDep} from 'system/base/EntityBase';
import DriverBase from 'system/base/DriverBase';
import {byteToBinArr, getBitFromByte, updateBitInByte} from 'system/lib/binaryHelpers';
import {Edge} from 'system/interfaces/io/DigitalIo';
import DebounceCall from 'system/lib/DebounceCall';
import IndexedEvents from 'system/lib/IndexedEvents';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';


export type ChangeStateHandler = (targetPin: number, value: boolean) => void;

export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
}


// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;
// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: Array<number> = [];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  // State which is sets on write and removes after it
  private tmpState?: number;
  private wasIcInited: boolean = false;
  private initingIcInProgress: boolean = false;
  private readonly pinEdges: {[index: string]: Edge | undefined} = {};
  private readonly pinDebounces: {[index: string]: number | undefined} = {};
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly events = new IndexedEvents<ChangeStateHandler>();

  private get i2cDriver(): I2cToSlave {
    return this.depsInstances.i2cDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cDriver = await getDriverDep('I2cToSlave')
      .getInstance({
        ...this.props,
        poll: [
          {length: DATA_LENGTH}
        ],
      });
  }

  protected didInit = async () => {
    this.i2cDriver.addPollErrorListener((dataAddressStr: number | string | undefined, err: Error) => {
      this.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
  }

  protected appDidInit = async () => {
    // init IC state after app is initialized if it isn't at this moment
    try {
      await this.writeToIc(this.currentState);
    }
    catch (err) {
      this.log.error(`PCF8574. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }


  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      this.log.warn(`PCF8574Driver.setupInput(${pin}, ${debounce}, ${edge}). This pin has been already set up`);

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
      this.log.warn(`PCF8574Driver.setupOutput(${pin}, ${outputInitialValue}). This pin has been already set up`);

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

    // TODO: что будет если ещё выполнится 2й запрос в очереди - на тот момент же будет удален tmpState ???

    if (typeof this.tmpState === 'undefined') {
      this.tmpState = this.currentState;
    }

    this.tmpState = updateBitInByte(this.tmpState, pin, value);

    try {
      await this.writeToIc(this.tmpState);

      if (this.tmpState) {
        this.currentState = this.tmpState;
        this.tmpState = undefined;
      }
    }
    catch (err) {
      this.tmpState = undefined;

      throw err;
    }
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: boolean[]): Promise<void> {
    if (!this.checkInitialization('writeState')) return;

    if (typeof this.tmpState === 'undefined') {
      this.tmpState = this.currentState;
    }

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skit not an output pin
      if (this.directions[pin] !== DIR_OUT) continue;

      this.tmpState = updateBitInByte(this.tmpState, pin, outputValues[pin]);
    }

    try {
      await this.writeToIc(this.tmpState);

      if (this.tmpState) {
        this.currentState = this.tmpState;
        this.tmpState = undefined;
      }
    }
    catch (err) {
      this.tmpState = undefined;

      throw err;
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
  private async writeToIc(newState: number): Promise<void> {
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
      this.log.warn(`PCF8574Driver.${methodWhichCheck}. IC initialization is in progress. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    else if (!this.context.isInitialized) {
      this.log.warn(`PCF8574Driver.${methodWhichCheck}. It runs before app is initialized. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    
    return true;
  }

  private checkPin(pin: number) {
    if (pin < 0 || pin >= PINS_COUNT) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  // TODO: remove ???
  private updateCurrentState(pin: number, newValue: boolean) {
    this.currentState = updateBitInByte(this.currentState, pin, newValue);
  }

  private hasInputPins(): boolean {
    return this.directions.includes(DIR_IN);
  }


  protected validateProps = (props: Pcf8574ExpanderProps): string | undefined => {

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


export default class Factory extends DriverFactoryBase<Pcf8574> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus || 'default'}-${props.address}`;
  }
  protected DriverClass = Pcf8574;
}
