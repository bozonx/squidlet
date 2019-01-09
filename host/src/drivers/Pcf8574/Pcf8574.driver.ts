/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cNodeDriver, Handler, I2cNodeDriverBaseProps} from '../I2c/I2cNode.driver';
import {byteToBinArr, updateBitInByte} from '../../helpers/binaryHelpers';
import {PinMode} from '../../app/interfaces/dev/Digital';


export type ResultHandler = (values?: boolean[]) => void;

export interface ExpanderDriverProps extends I2cNodeDriverBaseProps {
}


// Constant for undefined pin direction (unused pin).
export const DIR_UNDEF = -1;
// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;

export const PINS_COUNT = 8;


export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  // Direction of each pin. By default all pin directions are undefined
  private directions:Array<number> = [
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  ];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  private wasIcInited: boolean = false;

  private get i2cNode(): I2cNodeDriver {
    return this.depsInstances.i2cNode as I2cNodeDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cNode = await getDriverDep('I2cNode.driver')
      .getInstance({
        ...this.props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });
  }

  protected didInit = async () => {
    this.i2cNode.addPollErrorListener((err: Error) => {
      this.env.log.error(String(err));
    });
  }

  protected appDidInit = async () => {
    // init IC state after app is inited if it isn't inited at this moment
    if (!this.wasIcInited) await this.initIc();
  }


  async setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    this.checkPin(pin);

    if (this.directions[pin] !== DIR_UNDEF) {
      this.env.log.warn(`PCF8574Driver.setup(${pin}, ${pinMode}, ${outputInitialValue}). This pin has been already set up`);

      return;
    }

    if (pinMode === 'output') {
      // output pin
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.directions[pin] = DIR_OUT;
      // update local state
      this.currentState = this.updatePinInBitMask(this.currentState, pin, outputInitialValue);
    }
    else {
      // input pin
      if (pinMode !== 'input') {
        this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
      }

      // set input pin to high
      this.currentState = this.updatePinInBitMask(this.currentState, pin, true);
      this.directions[pin] = DIR_IN;
    }
  }

  /**
   * Add listener to change of any pin.
   */
  addListener(handler: ResultHandler): number {

    // TODO: review
    // TODO: ожидается что ResultHandler будет string а не number

    const wrapper: Handler = () => {
      this.setLastReceivedState();

      // TODO: поидее если стейт не изменился то не поднимать событие, так как полинг будет делаться часто

      handler(null, this.getState());
    };

    return this.i2cNode.addListener(wrapper);
  }

  removeListener(handlerIndex: number) {

    // TODO: ожидается что ResultHandler будет string а не number

    this.i2cNode.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<void> {

    // TODO: review

    // if (!this.env.system.isInitialized) {
    //   this.env.log.warn(`PCF8574Driver.poll(). It runs before app is initialized`);
    // }

    // init IC if it isn't inited at this moment
    if (!this.wasIcInited) await this.initIc();

    await this.i2cNode.poll();
    this.setLastReceivedState();
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

    return ((this.currentState>>pin) % 2 !== 0);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    this.checkPin(pin);

    if (this.directions[pin] !== DIR_OUT) {
      throw new Error('Pin is not defined as an output');
    }

    // update local state
    this.currentState = this.updatePinInBitMask(this.currentState, pin, value);
    // write to IC
    await this.writeToIc();
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: boolean[]): Promise<void> {
    let newState: number = this.currentState;

    for (let pin = 0; pin < 8; pin++) {
      if (this.directions[pin] !== DIR_OUT) {
        // isn't an output pin
        continue;
      }

      newState = this.updatePinInBitMask(newState, pin, outputValues[pin]);
    }

    this.currentState = newState;

    return this.writeToIc();
  }


  private setLastReceivedState() {
    const lastData: Uint8Array | undefined = this.i2cNode.getLastData();

    if (!lastData) return;

    // TODO: брать только значения input пинов!!!!! см writeState
    // TODO: нужно ли инвертировать???

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', lastData[0].toString(2));
    // TODO: use it
    //this.currentState = lastData[0];


    // TODO: review old code

    // // check each input for changes
    // for(let pin = 0; pin < 8; pin++){
    //   if(this.directions[pin] !== DIR_IN){
    //     continue; // isn't an input pin
    //   }
    //   if((this.currentState>>pin) % 2 !== (readState>>pin) % 2){
    //     // pin changed
    //     let value: boolean = ((readState>>pin) % 2 !== 0);
    //     this.currentState = this.updatePinInBitMask(this.currentState, <number>pin, value);
    //     if(noEmit !== pin){
    //       this.events.emit(INPUT_EVENT_NAME, <InputData>{pin: pin, value: value});
    //     }
    //   }
    // }
  }

  /**
   * Do first write to IC if it doesn't do before.
   */
  private async initIc() {

    // TODO: review

    try {
      await this.writeToIc();
    }
    catch (err) {
      this.env.log.error(`PCF8574.driver. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }

  /**
   * Write the current state to the IC.
   * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async writeToIc () {
    // it means that IC is inited when first data is written
    this.wasIcInited = true;

    // set all input pins to high
    const newIcState = this.currentState;
    const dataToSend: Uint8Array = new Uint8Array(1);

    // send one byte to IC
    dataToSend[0] = newIcState;

    await this.i2cNode.write(undefined, dataToSend);
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
