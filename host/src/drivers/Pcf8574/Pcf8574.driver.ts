/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cToSlaveDriver, I2cToSlaveDriverProps} from '../I2c/I2cToSlave.driver';
import {byteToBinArr, getBitFromByte, updateBitInByte} from '../../helpers/binaryHelpers';
import {DigitalPinMode} from '../../app/interfaces/dev/Digital';


export type ResultHandler = (values: boolean[]) => void;

export interface ExpanderDriverProps extends I2cToSlaveDriverProps {
}


// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;
// Count of pins which IC has
export const PINS_COUNT = 8;


export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: Array<number> = [];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  private wasIcInited: boolean = false;
  private initingIcInProgress: boolean = false;
  private mainListenerWasAdded: boolean = false;

  private get i2cDriver(): I2cToSlaveDriver {
    return this.depsInstances.i2cDriver as I2cToSlaveDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cDriver = await getDriverDep('I2cNode.driver')
      .getInstance({
        ...this.props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });

    this.i2cDriver.addPollErrorListener((dataAddressStr: number | string, err: Error) => {
      this.env.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);

    this.mainListenerWasAdded = true;
  }

  protected appDidInit = async () => {
    // init IC state after app is inited if it isn't inited at this moment
    try {
      await this.writeToIc();
    }
    catch (err) {
      this.env.log.error(`PCF8574.driver. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }


  async setup(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] === 'undefined') {
      this.env.log.warn(`PCF8574Driver.setup(${pin}, ${pinMode}, ${outputInitialValue}). This pin has been already set up`);

      return;
    }

    if (pinMode === 'output') {
      // output pin
      // output initial value has to be specified
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.directions[pin] = DIR_OUT;
      this.updateCurrentState(pin, outputInitialValue);
    }
    else {
      // input pin
      if (pinMode !== 'input') {
        this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
      }

      // set input pin to high
      this.updateCurrentState(pin, true);
      this.directions[pin] = DIR_IN;
    }
  }

  /**
   * Add listener to change of any pin.
   * Call this method inside a didInit() callback of your driver or device or after.
   */
  addListener(handler: ResultHandler): number {
    if (!this.mainListenerWasAdded) {
      throw new Error(`PCF8574Driver.addListener: You try to add listener too early. Please add it inside a didInit callback or after`);
    }

    const wrapper = () => {
      handler(this.getState());
    };

    return this.i2cDriver.addListener(wrapper);
  }

  removeListener(handlerIndex: number) {
    this.i2cDriver.removeListener(handlerIndex);
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

    // update local state before writing to IC
    this.updateCurrentState(pin, value);
    // write to IC
    await this.writeToIc();

    // TODO: вернуть старый стейт если запись не удалась
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: boolean[]): Promise<void> {
    if (!this.checkInitialization('writeState')) return;

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // isn't an output pin
      if (this.directions[pin] !== DIR_OUT) continue;

      this.updateCurrentState(pin, outputValues[pin]);
    }

    return this.writeToIc();

    // TODO: вернуть старый стейт если запись не удалась
  }


  private handleIcStateChange = (dataAddressStr: number | string, data: Uint8Array) => {
    if (!data || data.length !== 1) {
      throw new Error(`PCF8574Driver: No data has been received`);
    }

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', data[0].toString(2));

    // TODO: нужно ли инвертировать???

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // isn't an output pin
      if (this.directions[pin] !== DIR_OUT) continue;

      this.updateCurrentState(pin, getBitFromByte(data[0], pin));
    }
  }

  /**
   * Write the current state to the IC.
   * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async writeToIc () {
    if (!this.wasIcInited) {
      this.initingIcInProgress = true;
    }

    // it means that IC is inited when first data is written
    this.wasIcInited = true;

    // set all input pins to high
    const newIcState = this.currentState;
    const dataToSend: Uint8Array = new Uint8Array(1);

    // send one byte to IC
    dataToSend[0] = newIcState;

    await this.i2cDriver.write(undefined, dataToSend);

    this.initingIcInProgress = false;
  }

  private checkInitialization(methodWhichCheck: string): boolean {
    if (!this.initingIcInProgress) {
      this.env.log.warn(`PCF8574Driver.${methodWhichCheck}. IC initialization is in progress. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    else if (!this.env.system.isInitialized) {
      this.env.log.warn(`PCF8574Driver.${methodWhichCheck}. It runs before app is initialized. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    
    return true;
  }
  
  /**
   * Helper function to set/clear one bit in a bitmask.
   * @param  {number}            current The current bitmask.
   * @param  {number}            pin     The bit-number in the bitmask.
   * @param  {boolean}           value   The new value for the bit. (true=set, false=clear)
   * @return {number}                    The new (modified) bitmask.
   */
  private updatePinInBitMask(current: number, pin: number, value: boolean): number{
    return updateBitInByte(current, pin, value);
  }

  private getLastPinNumber(): number {
    return PINS_COUNT - 1;
  }

  private checkPin(pin: number) {
    if (pin < 0 || pin > this.getLastPinNumber()) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  private updateCurrentState(pin: number, newValue: boolean) {
    this.currentState = this.updatePinInBitMask(this.currentState, pin, newValue);
  }

  private hasInputPins(): boolean {
    return this.directions.includes(DIR_IN);

    // for (let direction of this.directions) {
    //   if (direction === DIR_IN) {
    //     return true;
    //   }
    // }
    //
    // return false;
  }


  protected validateProps = (props: ExpanderDriverProps): string | undefined => {

    // if(address < 0 || address > 255){
    //   throw new Error('Address out of range');
    // }

    return;
  }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
  protected DriverClass = PCF8574Driver;
}
