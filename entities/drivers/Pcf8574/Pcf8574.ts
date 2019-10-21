/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {byteToBinArr, getBitFromByte, updateBitInByte} from 'system/lib/binaryHelpers';
import DebounceCall from 'system/lib/debounceCall/DebounceCall';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {Edge, PinDirection} from 'system/interfaces/gpioTypes';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';


export type ChangeStateHandler = (level: boolean) => void;

export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: (PinDirection | undefined)[] = [];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  // State which is sets on write and removes after it
  private tmpState?: number;
  private wasIcInited: boolean = false;
  // TODO: review
  private initingIcInProgress: boolean = false;
  // collection of numbers of ms to use in debounce logic for each pin.
  private readonly pinDebounces: {[index: string]: number | undefined} = {};
  // collection of edges values of each pin to use in change handler
  private readonly pinEdges: {[index: string]: Edge | undefined} = {};
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly changeEvents = new IndexedEventEmitter<ChangeStateHandler>();

  private get i2cDriver(): I2cToSlave {
    return this.depsInstances.i2cDriver;
  }


  init = async () => {
    this.depsInstances.i2cDriver = await this.context.getSubDriver(
      'I2cToSlave',
      {
        ...this.props,
        // TODO: review
        poll: [
          {length: DATA_LENGTH}
        ],
      }
    );

    // TODO: review
    this.i2cDriver.addPollErrorListener((functionStr: number | string | undefined, err: Error) => {
      this.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
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
   */
  async initIc() {
    // TODO: add
    //await this.writeToIc(this.currentState);
  }


  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupInput(${pin}, ${debounce}, ${edge}). This pin has been already set up.` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.pinDebounces[pin] = debounce;
    this.pinEdges[pin] = edge;
    this.directions[pin] = PinDirection.input;

    // set input pin to high
    this.updateCurrentState(pin, true);
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
      this.updateCurrentState(pin, outputInitialValue);
    }
  }

  async getPinDirection(pin: number): Promise<PinDirection | undefined> {
    //return this.resolvePinDirection(pin);
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   * Call this method inside a init() callback of your driver or device or after.
   */
  onChange(pin: number, handler: ChangeStateHandler): number {
    return this.changeEvents.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
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

  // TODO: не нужно !!!
  async getPinMode(pin: number): Promise<'input' | 'output' | undefined> {
    if (this.directions[pin] === PinDirection.input) {
      return 'input';
    }
    else if (this.directions[pin] === PinDirection.output) {
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

    if (this.directions[pin] !== PinDirection.output) {
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
      if (this.directions[pin] !== PinDirection.output) continue;

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

  clearPin(pin: number) {
    // TODO: add
  }

  clearAll() {
    // TODO: add
  }


  private handleIcStateChange = (functionStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      throw new Error(`PCF8574Driver: No data has been received`);
    }

    const oldState = this.currentState;

    //console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', data[0].toString(2));

    // TODO: нужно ли инвертировать???

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;

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
      if (this.directions[pinNum] !== PinDirection.input) continue;

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
      this.changeEvents.emit(pinNum, pinValue);
    }
    else {
      // wait for debounce and read current level
      this.debounceCall.invoke(async () => {
        const realLevel = await this.read(pinNum);

        this.changeEvents.emit(pinNum, realLevel);
      }, this.pinDebounces[pinNum], pinNum);
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

  // TODO: решить на каком уровне делать
  // TODO: использовать board setup
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
    return this.directions.includes(PinDirection.input);
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


export default class Factory extends DriverFactoryBase<Pcf8574, Pcf8574ExpanderProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: Pcf8574ExpanderProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
