/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

const _omit = require('lodash/omit');

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cNodeDriver, Handler, I2cNodeDriverBaseProps} from '../I2c/I2cNode.driver';
import {byteToBinArr, updateBitInByte} from '../../helpers/helpers';
import {PinMode} from '../../app/interfaces/dev/Digital';
import Republish from '../../helpers/Republish';


export type ResultHandler = (err: Error | null, values?: boolean[]) => void;

export interface ExpanderDriverProps extends I2cNodeDriverBaseProps {
  resendStateInterval?: number;
}


// Constant for undefined pin direction (unused pin).
export const DIR_UNDEF = -1;
// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;


export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  /** Direction of each pin. By default all pin directions are undefined. */
  private directions:Array<number> = [
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  ];
  /** Bitmask for all input pins. Used to set all input pins to high on the PCF8574/PCF8574A IC. */
  private inputPinBitmask: number = 0;
  /** Bitmask representing the current state of the pins. */
  private currentState: number = 0;
  private wasIcInited: boolean = false;
  protected republish?: Republish;

  private get i2cNode(): I2cNodeDriver {
    return this.depsInstances.i2cNode as I2cNodeDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cNode = await getDriverDep('I2cNode.driver')
      .getInstance({
        ..._omit(this.props, 'resendStateInterval'),
        pollDataLength: 1,
        pollDataAddress: undefined,
      });

    if (this.props.resendStateInterval) {
      this.republish = new Republish(this.props.resendStateInterval);
    }
  }

  protected didInit = async () => {
    // init IC state after app is inited if it isn't inited at this moment
    this.env.system.onAppInit(async () => {
      if (!this.wasIcInited) await this.initIc();
    });
  }


  async setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    if (pin < 0 || pin > 7) {
      throw new Error('Pin out of range');
    }

    if (pinMode === 'output') {
      // output pin
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, false);
      this.directions[pin] = DIR_OUT;
      // update local state
      this.currentState = this.updatePinInBitMask(this.currentState, pin, outputInitialValue);
    }
    else {
      // input pin
      if (pinMode !== 'input') {
        this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
      }

      this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, true);
      this.directions[pin] = DIR_IN;
    }
  }

  /**
   * Add listener to change of any pin.
   */
  addListener(handler: ResultHandler) {
    const wrapper: Handler = (error: Error | null) => {
      if (error) {
        return handler(error);
      }

      this.setLastReceivedState();
      handler(null, this.getValues());
    };

    this.i2cNode.addListener(wrapper);
  }

  removeListener(handler: ResultHandler) {

    // TODO: do it - сохранять wrappers

    //this.i2cNode.removeListener(handler);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<boolean[]> {
    // init IC if it isn't inited at this moment
    if (!this.wasIcInited) await this.initIc();

    await this.i2cNode.poll();
    this.setLastReceivedState();

    return this.getValues();
  }

  getPinMode(pin: number): 'input' | 'output' | undefined {
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
   * Returns array like [true, true, false, false, true, true, false, false]
   */
  getValues(): boolean[] {
    return byteToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  read(pin: number): boolean {
    if (pin < 0 || pin > 7) {
      return false;
    }
    
    return ((this.currentState>>pin) % 2 !== 0);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value:boolean): Promise<void> {
    if (pin < 0 || pin > 7) {
      throw new Error('Pin out of range');
    }
    else if (this.directions[pin] !== DIR_OUT) {
      throw new Error('Pin is not defined as output');
    }

    // update local state
    this.currentState = this.updatePinInBitMask(this.currentState, pin, value);
    // write to IC
    await this.writeToIc();
  }


  private setLastReceivedState() {
    const lastData: Uint8Array | undefined = this.i2cNode.getLastData();

    if (!lastData) return;

    // TODO: брать только значения input пинов!!!!!
    // TODO: нужно ли инвертировать???

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', lastData[0].toString(2));
    // TODO: use it
    //this.currentState = lastData[0];


    // TODO: review old code
    // TODO: see setAllPins

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
   * Write the current state to the IC.
   * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async writeToIc () {
    // it means that IC is inited when first data is written
    this.wasIcInited = true;

    // clear republish and start again
    if (this.republish) {

      // TODO: нет от него толка - потомучто статус работает не правильно - если не получилось то от не переключает

      //this.republish.start(this.doResend);
    }

    // set all input pins to high
    const newIcState = this.currentState | this.inputPinBitmask;
    const dataToSend: Uint8Array = new Uint8Array(1);

    dataToSend[0] = newIcState;

    await this.i2cNode.write(undefined, dataToSend);
  }

  /**
   * Do first write to IC if it doesn't do before.
   */
  async initIc() {
    try {
      await this.writeToIc();
    }
    catch (err) {
      this.env.log.error(`PCF8574.driver. Can't init IC state. ${String(err)}`);
    }
  }

  private doResend = async () => {
    try {
      await this.writeToIc();
    }
    catch (err) {
      this.env.log.error(`PCF8574.driver. Can't resend state to IC. ${String(err)}`);
    }
  }

  /**
   * Set the given value to all output pins.
   * @param  {boolean} value The new value for all output pins.
   * @return {Promise}
   */
  private setAllPins(value:boolean): Promise<void>{

    // TODO: reveiw - зачем вообще нужно ???

    let newState:number = this.currentState;

    for(let pin = 0; pin < 8; pin++){
      if(this.directions[pin] !== DIR_OUT){
        continue; // isn't an output pin
      }
      newState = this.updatePinInBitMask(newState, pin, value);
    }

    this.currentState = newState;

    return this.writeToIc();
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


  protected validateProps = (props: ExpanderDriverProps): string | undefined => {

    // if(address < 0 || address > 255){
    //   throw new Error('Address out of range');
    // }

    return;
  }



  // /**
  //  * Define a pin as an output.
  //  * This marks the pin to be used as an output pin.
  //  * It just setup pin but don't set initial value, you should set it manually.
  //  * @param  {number}  pin          The pin number. (0 to 7)
  //  * @return {Promise}
  //  */
  // async setupOutputPin(pin: number, outputInitialValue: boolean) {
  //   if (pin < 0 || pin > 7) {
  //     throw new Error('Pin out of range');
  //   }
  //
  //   this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, false);
  //   this.directions[pin] = DIR_OUT;
  //
  //   // // set the initial value only if it is defined, otherwise keep the last value (probably from the initial state)
  //   // if (typeof (initialValue) === 'undefined') {
  //   //   return;
  //   // }
  //   // else {
  //   //
  //   //   // TODO: review
  //   //
  //   //   return this._setPinInternal(pin, initialValue);
  //   // }
  // }
  //
  // /**
  //  * Define a pin as an input.
  //  * This marks the pin for input processing and activates the high level on this pin.
  //  * @param  {number} pin      The pin number. (0 to 7)
  //  * @return {Promise}
  //  */
  // async setupInputPin(pin: number): Promise<void> {
  //   if (pin < 0 || pin > 7) {
  //     return Promise.reject(new Error('Pin out of range'));
  //   }
  //
  //   this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, true);
  //   this.directions[pin] = DIR_IN;
  //
  //   // TODO: нужно записать после установки пинов
  //
  //   // call writeToIc() to activate the high level on the input pin ...
  //   //await this.writeToIc();
  //
  //   // TODO: может не делать на время конфигурации ???
  //
  //   // ... and then poll all current inputs with noEmit on this pin to suspress the event
  //   //await this._poll(pin);
  // }

  // private resolveInitialState(): number {
  //   if (this.props.initialState === true) {
  //     return 255;
  //   }
  //   else if (this.props.initialState === false) {
  //     return 0;
  //   }
  //   else if (
  //     typeof(this.props.initialState) !== 'number'
  //     || this.props.initialState < 0
  //     || this.props.initialState > 255
  //   ) {
  //     throw new Error('InitalState bitmask out of range');
  //   }
  //
  //   return this.props.initialState;
  // }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
  protected DriverClass = PCF8574Driver;
}
