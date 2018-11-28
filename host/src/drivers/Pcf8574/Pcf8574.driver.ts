/*
 * Port of https://www.npmjs.com/package/pcf8574 module
 */

import * as EventEmitter from 'eventemitter3';
const _omit = require('lodash/omit');

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverBase from '../../app/entities/DriverBase';
import {I2cNodeDriver} from '../I2c/I2cNode.driver';


type Handler = (data: InputData) => void;
type PinNumber = number;

interface InputData {
  pin: number;
  value: boolean;
}

export interface ExpanderDriverProps {

  // TODO: ??? use props from I2cNode

  //address: string | number;
  address: number;
}


/** Constant for undefined pin direction (unused pin). */
export const DIR_UNDEF = -1;
/** Constant for input pin direction. */
export const DIR_IN = 1;
/** Constant for output pin direction. */
export const DIR_OUT = 0;
const INPUT_EVENT_NAME = 'input';


/**
 * Class for handling a PCF8574/PCF8574A IC.
 */
export class PCF8574Driver extends DriverBase<ExpanderDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  /** Direction of each pin. By default all pin directions are undefined. */
  private _directions:Array<number> = [
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
    DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  ];
  /** Bitmask for all input pins. Used to set all input pins to high on the PCF8574/PCF8574A IC. */
  private _inputPinBitmask:number = 0;
  /** Bitmask representing the current state of the pins. */
  private _currentState: number = 0;

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
      .getInstance(this.props);


    // // save the inital state as current sate and write it to the IC
    // this._currentState = this.resolveInitialState();
    //
    // const dataToSend: Uint8Array = new Uint8Array(1);
    //
    // dataToSend[0] = this._currentState;

    // TODO: remove
    //await this.i2cMaster.write(this.props.address, undefined, dataToSend);
  }

  addEventListener(cb: Handler) {
    this.events.addListener(INPUT_EVENT_NAME, cb);
  }

  removeEventListener(cb: Handler) {
    this.events.removeListener(INPUT_EVENT_NAME, cb);
  }

  /**
   * Manually poll changed inputs from the PCF8574/PCF8574A IC.
   * If a change on an input is detected, an "input" Event will be emitted with a data object containing the "pin" and the new "value".
   * This have to be called frequently enough if you don't use a GPIO for interrupt detection.
   * If you poll again before the last poll was completed, the promise will be rejected with an error.
   * @return {Promise}
   */
  doPoll():Promise<void>{
    return this._poll();
  }

  getPinMode(pin: PinNumber): 'input' | 'output' | undefined {
    if (this._directions[pin] === DIR_IN) {
      return 'input';
    }
    else if (this._directions[pin] === DIR_OUT) {
      return 'output';
    }

    return;
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {PinNumber} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  getPinValue(pin: PinNumber): boolean {
    if(pin < 0 || pin > 7){
      return false;
    }
    return ((this._currentState>>pin) % 2 !== 0);
  }

  /**
   * Define a pin as an output.
   * This marks the pin to be used as an output pin.
   * @param  {PCF8574.PinNumber} pin          The pin number. (0 to 7)
   * @param  {boolean}           inverted     true if this pin should be handled inverted (true=low, false=high)
   * @param  {boolean}           initialValue (optional) The initial value of this pin, which will be set immediatly.
   * @return {Promise}
   */
  async outputPin(pin: PinNumber, inverted:boolean, initialValue?:boolean) {

    // TODO: remove inverted
    // TODO: remove initialValue

    if(pin < 0 || pin > 7){
      throw new Error('Pin out of range');
    }

    //this._inverted = this._setStatePin(this._inverted, pin, inverted);

    this._inputPinBitmask = this._setStatePin(this._inputPinBitmask, pin, false);

    this._directions[pin] = DIR_OUT;

    // set the initial value only if it is defined, otherwise keep the last value (probably from the initial state)
    if(typeof(initialValue) === 'undefined'){
      return;
    }else{
      return this._setPinInternal(pin, initialValue);
    }
  }

  /**
   * Define a pin as an input.
   * This marks the pin for input processing and activates the high level on this pin.
   * @param  {PCF8574.PinNumber} pin      The pin number. (0 to 7)
   * @param  {boolean}           inverted true if this pin should be handled inverted (high=false, low=true)
   * @return {Promise}
   */
  inputPin(pin: PinNumber, inverted:boolean): Promise<void> {
    if(pin < 0 || pin > 7){
      return Promise.reject(new Error('Pin out of range'));
    }

    // TODO: remove inverted
    //this._inverted = this._setStatePin(this._inverted, pin, inverted);

    this._inputPinBitmask = this._setStatePin(this._inputPinBitmask, pin, true);

    this._directions[pin] = DIR_IN;

    // call _setNewState() to activate the high level on the input pin ...
    return this._setNewState()
    // ... and then poll all current inputs with noEmit on this pin to suspress the event
      .then(() => {
        return this._poll(pin);
      });
  }

  /**
   * Set the value of an output pin.
   * If no value is given, the pin will be toggled.
   * @param  {PCF8574.PinNumber} pin   The pin number. (0 to 7)
   * @param  {boolean}           value The new value for this pin.
   * @return {Promise}
   */
  setPin(pin: PinNumber, value?:boolean): Promise<void>{
    if(pin < 0 || pin > 7){
      return Promise.reject(new Error('Pin out of range'));
    }

    if(this._directions[pin] !== DIR_OUT){
      return Promise.reject(new Error('Pin is not defined as output'));
    }

    if(typeof(value) == 'undefined'){
      // set value dependend on current state to toggle
      value = !((this._currentState>>pin) % 2 !== 0);
    }

    return this._setPinInternal(pin, value);
  }


  /**
   * Helper function to set/clear one bit in a bitmask.
   * @param  {number}            current The current bitmask.
   * @param  {PCF8574.PinNumber} pin     The bit-number in the bitmask.
   * @param  {boolean}           value   The new value for the bit. (true=set, false=clear)
   * @return {number}                    The new (modified) bitmask.
   */
  private _setStatePin(current:number, pin: PinNumber, value:boolean):number{
    if(value){
      // set the bit
      return current | 1 << pin;
    }else{
      // clear the bit
      return current & ~(1 << pin);
    }
  }

  /**
   * Write the current stateto the IC.
   * @param  {number}  newState (optional) The new state which will be set. If omitted the current state will be used.
   * @return {Promise}          Promise which gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async _setNewState(newState?:number) {
    if(typeof(newState) === 'number'){
      this._currentState = newState;
    }

    // set all input pins to high
    const newIcState = this._currentState | this._inputPinBitmask;
    const dataToSend: Uint8Array = new Uint8Array(1);

    dataToSend[0] = newIcState;

    await this.i2cNode.write(undefined, dataToSend);
  }

  /**
   * Internal function to poll the changes from the PCF8574/PCF8574A IC.
   * If a change on an input is detected, an "input" Event will be emitted with a data object containing the "pin" and the new "value".
   * This is called if an interrupt occured, or if doPoll() is called manually.
   * Additionally this is called if a new input is defined to read the current state of this pin.
   * @param {PCF8574.PinNumber} noEmit (optional) Pin number of a pin which should not trigger an event. (used for getting the current state while defining a pin as input)
   * @return {Promise}
   */
  private async _poll(noEmit?: PinNumber): Promise<void> {
    // if(this._currentlyPolling){
    //   return Promise.reject('An other poll is in progress');
    // }

    // this._currentlyPolling = true;
    //
    // // TODO: use i2cNode's poll
    //
    // // read a byte
    // //const result: Uint8Array = await this.i2cNode.read(undefined, 1);
    // //await this.i2cNode.poll(undefined, 1);
    // const result: Uint8Array = await this.i2cNode.read(undefined, 1);
    //
    // this._currentlyPolling = false;
    //
    // // repect inverted with bitmask using XOR
    // const readState = result[0] ^ this._inverted;
    //
    // // check each input for changes
    // for(let pin = 0; pin < 8; pin++){
    //   if(this._directions[pin] !== DIR_IN){
    //     continue; // isn't an input pin
    //   }
    //   if((this._currentState>>pin) % 2 !== (readState>>pin) % 2){
    //     // pin changed
    //     let value: boolean = ((readState>>pin) % 2 !== 0);
    //     this._currentState = this._setStatePin(this._currentState, <PinNumber>pin, value);
    //     if(noEmit !== pin){
    //       this.events.emit(INPUT_EVENT_NAME, <InputData>{pin: pin, value: value});
    //     }
    //   }
    // }
  }

  /**
   * Internal function to set the state of a pin, regardless its direction.
   * @param  {PinNumber} pin   The pin number. (0 to 7)
   * @param  {boolean}           value The new value.
   * @return {Promise}
   */
  private _setPinInternal(pin: PinNumber, value:boolean): Promise<void>{
    let newState:number = this._setStatePin(this._currentState, pin, value);

    return this._setNewState(newState);
  }

  /**
   * Set the given value to all output pins.
   * @param  {boolean} value The new value for all output pins.
   * @return {Promise}
   */
  private setAllPins(value:boolean): Promise<void>{
    let newState:number = this._currentState;

    for(let pin = 0; pin < 8; pin++){
      if(this._directions[pin] !== DIR_OUT){
        continue; // isn't an output pin
      }
      newState = this._setStatePin(newState, <PinNumber>pin, value);
    }

    return this._setNewState(newState);
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

  // /**
  //  * Enable the interrupt detection on the specified GPIO pin.
  //  * You can use one GPIO pin for multiple instances of the PCF8574 class.
  //  * @param {number} gpioPin BCM number of the pin, which will be used for the interrupts from the PCF8574/8574A IC.
  //  */
  // public enableInterrupt(gpioPin:number):void{
  //   if(PCF8574Driver._allInstancesUsedGpios[gpioPin] != null){
  //     // use already initalized GPIO
  //     this._gpio = PCF8574Driver._allInstancesUsedGpios[gpioPin];
  //     this._gpio['pcf8574UseCount']++;
  //   }else{
  //     // init the GPIO as input with falling edge,
  //     // because the PCF8574/PCF8574A will lower the interrupt line on changes
  //     this._gpio = new Gpio(gpioPin, 'in', 'falling');
  //     this._gpio['pcf8574UseCount'] = 1;
  //   }
  //   this._gpio.watch(this._handleInterrupt);
  // }

  // /**
  //  * Internal function to handle a GPIO interrupt.
  //  */
  // private _handleInterrupt():void{
  //   // poll the current state and ignore any rejected promise
  //   this._poll().catch(()=>{ });
  // }

  // /**
  //  * Disable the interrupt detection.
  //  * This will unexport the interrupt GPIO, if it is not used by an other instance of this class.
  //  */
  // public disableInterrupt():void{
  //   // release the used GPIO
  //   if(this._gpio !== null){
  //     // remove the interrupt handling
  //     this._gpio.unwatch(this._handleInterrupt);
  //
  //     // decrease the use count of the GPIO and unexport it if not used anymore
  //     this._gpio['pcf8574UseCount']--;
  //     if(this._gpio['pcf8574UseCount'] === 0){
  //       this._gpio.unexport();
  //     }
  //
  //     this._gpio = null;
  //   }
  // }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {
  protected DriverClass = PCF8574Driver;

  // TODO: review

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus}-${props.address}`;
  }
}
