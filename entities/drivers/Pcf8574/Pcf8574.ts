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
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';


export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive to IC
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
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();

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
    return this.directions[pin];
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.changeEvents.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Poll expander manually.
   */
  async pollOnce(): Promise<void> {
    // TODO: review
    if (!this.checkInitialization('poll')) return;
    // TODO: review
    else if (!this.wasIcInited) return;

    await this.i2cDriver.pollOnce();
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

  /**
   * Returns the current value of a pin.
   * If you did't setup poll or interrupt then call `pollOnce()` before
   * to be sure that you will receive the last actual data.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  read(pin: number): boolean {
    this.checkPin(pin);

    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    // TODO: review
    if (!this.checkInitialization('write')) return;

    this.checkPin(pin);

    if (this.directions[pin] !== PinDirection.output) {
      throw new Error('Pin is not defined as an output');
    }

    // It doesn't need to initialize IC, because new state will send below
    // TODO: пока идет инициализация - записывать просто в стейт

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
    // TODO: review
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
    for (let pin = 0; pin < PINS_COUNT; pin ++) {
      this.clearPin(pin);
    }
  }


  private handleIcStateChange = (functionStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
    }

    this.setNewInputsState(data[0]);
  }

  private setNewInputsState(receivedByte: number) {
    const newBoolState: boolean[] = byteToBinArr(receivedByte);
    const oldBoolState: boolean[] = byteToBinArr(this.currentState);
    // update values add rise change event of input pins which are changed
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;
      // if value was changed then update state and rise an event.
      // TODO: проверять только после debounce
      if (newBoolState[pin] !== oldBoolState[pin]) {
        // TODO: значение можно устанавливать только когда пройдет debounce !!!!
        this.updateCurrentState(pin, newBoolState[pin]);
        this.emitPinEvent(pin, newBoolState[pin]);
      }
    }
  }

  private emitPinEvent(pin: number, pinValue: boolean) {
    // TODO: проверять только после debounce!!!!
    // skip not suitable edge
    if (this.pinEdges[pin] === Edge.rising && !pinValue) {
      return;
    }
    else if (this.pinEdges[pin] === Edge.falling && pinValue) {
      return;
    }

    if (!this.pinDebounces[pin]) {
      // TODO: установить значение если изменилось и проверить edge
      // emit right now if there isn't debounce
      this.changeEvents.emit(pin, pinValue);
    }
    else {
      // wait for debounce and read current level
      this.debounceCall.invoke(
        () => this.handleEndOfDebounce(pin, pinValue),
        this.pinDebounces[pin],
        pin
      )
        .catch((e) => this.log.error(e));
    }
  }

  private handleEndOfDebounce(pin: number, valueBeforeInvoke: boolean) {
    // make poll and then read a value to confirm valueBeforeInvoke.
    this.pollOnce()
      .then(() => {
        const newValue: boolean = this.read(pin);

        // TODO: test by hard!
        // value hasn't been confirmed - means actually didn't change.
        if (valueBeforeInvoke !== newValue) return;

        this.changeEvents.emit(pin, newValue);
      })
      .catch((e) => this.log.error(e));
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
