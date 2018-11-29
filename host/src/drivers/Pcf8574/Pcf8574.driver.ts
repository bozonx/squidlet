/*
 * Remake of https://www.npmjs.com/package/pcf8574 module
 */

import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cNodeDriver, Handler} from '../I2c/I2cNode.driver';
import {hexToBinArr, updateBitInByte} from '../../helpers/helpers';
import {ImpulseInputDriverProps} from '../Binary/ImpulseInput.driver';


type PinNumber = number;
export type ResultHandler = (err: Error | null, values?: boolean[]) => void;

export interface ExpanderDriverProps extends MasterSlaveBusProps {
  int?: ImpulseInputDriverProps;
  bus?: string | number;
  address: string | number;
}


// Constant for undefined pin direction (unused pin).
export const DIR_UNDEF = -1;
// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;


/**
 * Class for handling a PCF8574/PCF8574A IC.
 */
export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  /** Direction of each pin. By default all pin directions are undefined. */
  private _directions:Array<number> = [
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  ];
  /** Bitmask for all input pins. Used to set all input pins to high on the PCF8574/PCF8574A IC. */
  private _inputPinBitmask: number = 0;
  /** Bitmask representing the current state of the pins. */
  private currentState: number = 0;

  private get i2cNode(): I2cNodeDriver {
    return this.depsInstances.i2cNode as I2cNodeDriver;
  }


  /**
   * Constructor for a new PCF8574/PCF8574A instance.
   * If you use this IC with one or more input pins, you have to call ...
   *  a) enableInterrupt(gpioPin) to detect interrupts from the IC using a GPIO pin, or
   *  b) doPoll() frequently enough to detect input changes with manually polling.
   * @param  {boolean|number} initialState The initial state of the pins of this IC. You can set a bitmask to define each pin seprately, or use true/false for all pins at once.
   */

  protected willInit = async (getDriverDep: GetDriverDep) => {
    // TODO: send feedback props

    this.depsInstances.i2cNode = await getDriverDep('I2cNode.driver')
      .getInstance({
        ...this.props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });


    // // save the inital state as current sate and write it to the IC
    // this.currentState = this.resolveInitialState();
    //
    // const dataToSend: Uint8Array = new Uint8Array(1);
    //
    // dataToSend[0] = this.currentState;

    // TODO: remove
    //await this.i2cMaster.write(this.props.address, undefined, dataToSend);
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
    await this.i2cNode.poll();
    this.setLastReceivedState();

    return this.getValues();
  }

  getPinMode(pin: PinNumber): 'input' | 'output' | undefined {
    if (this._directions[pin] === DIR_IN) {
      return 'input';
    }
    else if (this._directions[pin] === DIR_OUT) {
      return 'output';
    }

    // undefined means didn't specify
    return;
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false]
   */
  getValues(): boolean[] {
    return hexToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {PinNumber} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  getPinValue(pin: PinNumber): boolean {
    if (pin < 0 || pin > 7) {
      return false;
    }
    
    return ((this.currentState>>pin) % 2 !== 0);
  }

  /**
   * Define a pin as an output.
   * This marks the pin to be used as an output pin.
   * It just setup pin but don't set initial value, you should set it manually.
   * @param  {number}  pin          The pin number. (0 to 7)
   * @return {Promise}
   */
  async outputPin(pin: number) {
    if (pin < 0 || pin > 7) {
      throw new Error('Pin out of range');
    }

    this._inputPinBitmask = this.updatePinInBitMask(this._inputPinBitmask, pin, false);
    this._directions[pin] = DIR_OUT;

    // // set the initial value only if it is defined, otherwise keep the last value (probably from the initial state)
    // if (typeof (initialValue) === 'undefined') {
    //   return;
    // }
    // else {
    //
    //   // TODO: review
    //
    //   return this._setPinInternal(pin, initialValue);
    // }
  }

  /**
   * Define a pin as an input.
   * This marks the pin for input processing and activates the high level on this pin.
   * @param  {number} pin      The pin number. (0 to 7)
   * @return {Promise}
   */
  async inputPin(pin: number): Promise<void> {
    if (pin < 0 || pin > 7) {
      return Promise.reject(new Error('Pin out of range'));
    }

    this._inputPinBitmask = this.updatePinInBitMask(this._inputPinBitmask, pin, true);
    this._directions[pin] = DIR_IN;

    // TODO: нужно записать после установки пинов

    // call writeToIc() to activate the high level on the input pin ...
    //await this.writeToIc();

    // TODO: может не делать на время конфигурации ???

    // ... and then poll all current inputs with noEmit on this pin to suspress the event
    //await this._poll(pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async setPinValue(pin: number, value:boolean): Promise<void>{
    if (pin < 0 || pin > 7) {
      throw new Error('Pin out of range');
    }
    else if (this._directions[pin] !== DIR_OUT) {
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

    // TODO: может брать только значения input пинов???
    // TODO: нужно ли инвертировать???

    this.currentState = lastData[0];

    // // check each input for changes
    // for(let pin = 0; pin < 8; pin++){
    //   if(this._directions[pin] !== DIR_IN){
    //     continue; // isn't an input pin
    //   }
    //   if((this.currentState>>pin) % 2 !== (readState>>pin) % 2){
    //     // pin changed
    //     let value: boolean = ((readState>>pin) % 2 !== 0);
    //     this.currentState = this.updatePinInBitMask(this.currentState, <PinNumber>pin, value);
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
  private async writeToIc() {

    // TODO: review
    // TODO: use this.currentState

    // set all input pins to high
    const newIcState = this.currentState | this._inputPinBitmask;
    const dataToSend: Uint8Array = new Uint8Array(1);

    dataToSend[0] = newIcState;

    await this.i2cNode.write(undefined, dataToSend);
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
      if(this._directions[pin] !== DIR_OUT){
        continue; // isn't an output pin
      }
      newState = this.updatePinInBitMask(newState, <PinNumber>pin, value);
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
