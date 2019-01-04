/*
 * Driver for port expander based on arduino.
 * It supports the next types connection:
 * * I2C
 * * Serial
 * * Wifi
 * * Bluetooth
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
//import {I2cNodeDriver, Handler, I2cNodeDriverBaseProps} from '../I2c/I2cNode.driver';
import {byteToBinArr, getHexNumber, updateBitInByte} from '../../helpers/helpers';
import {PinMode} from '../../app/interfaces/dev/Digital';
import {omit} from '../../helpers/lodashLike';
import Connection, {Handler} from './Connection';
import DriverBase from '../../app/entities/DriverBase';


//  extends I2cNodeDriverBaseProps
export interface ExpanderDriverProps {
  pinCount: number;
}

export type PortExpanderPinMode = 'input'
  | 'input_pullup'
  | 'input_pulldown'
  | 'output'
  | 'analog_input'
  | 'analog_output'
  | 'pwm'
  | 'rx'
  | 'tx';

// TODO: наверное не нужно обрабатывать ошибку
export type ResultHandler = (err: Error | null, values?: boolean[]) => void;

const COMMANDS = {
  setup:              0x30,
  setupAll:           0x31,
  setOutputValue:     0x32,
  setAllOutputValues: 0x33,
  read:               0x34,
  readAll:            0x35,
};

const MODES = {
  output:         0x30,
  input:          0x31,
  input_pullup:   0x32,
  input_pulldown: 0x33,
  analog_input:   0x34,
  analog_output:  0x35,
  pwm:            0x36,
  rx:             0x37,
  tx:             0x38,
};

const DIGITAL_VALUE = {
  low: 0x30,
  high: 0x31,
};

const NO_MODE = 0x21;

// export const DIR_UNDEF = -1;
// // Constant for input pin direction.
// export const DIR_IN = 1;
// // Constant for output pin direction.
// export const DIR_OUT = 0;



export class PortExpanderDriver extends DriverBase<ExpanderDriverProps> {
  private readonly connection: Connection = new Connection();

  // pin modes which are stored during init time while setup IC is finished.
  private pinModes: {[index: string]: number} = {};
  // output pin values which are stored during init time while setup IC is finished.
  private initialOutputValues: {[index: string]: boolean} = {};

  // /** Direction of each pin. By default all pin directions are undefined. */
  // private directions:Array<number> = [
  //   DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
  //   DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  // ];
  // /** Bitmask for all input pins. Used to set all input pins to high on the PCF8574/PCF8574A IC. */
  // private inputPinBitmask: number = 0;
  /** Bitmask representing the current state of the pins. */
  private currentState: number = 0;
  // TODO: review
  private wasIcInited: boolean = false;


  protected willInit = async (getDriverDep: GetDriverDep) => {
    await this.connection.init(this.props, getDriverDep);
  }

  protected didInit = async () => {
    this.connection.addPollErrorListener((err: Error) => {
      this.env.log.error(String(err));
    });
  }

  protected appDidInit = async () => {

    // TODO: remove timeout

    setTimeout(async () => {
      // init IC state after app is inited if it isn't inited at this moment
      if (!this.wasIcInited) await this.initIc();
    }, 1000);
  }


  getLastPinNum(): number {
    return this.props.pinCount - 1;
  }


  /**
   * Set pin mode.
   * Please set pin mode once on startup.
   */
  async setup(pin: number, pinMode: PortExpanderPinMode, outputInitialValue?: boolean): Promise<void> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('Pin out of range');
    }

    if (pinMode === 'output') {
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.initialOutputValues[pin] = outputInitialValue;
    }

    this.pinModes[pin] = MODES[pinMode];
  }

  /**
   * Add listener to change of any pin.
   */
  addListener(handler: ResultHandler): number {

    // TODO: review

    const wrapper: Handler = () => {
      this.setLastReceivedState();
      handler(null, this.getValues());
    };

    return this.connection.addListener(wrapper);
  }

  removeListener(handlerIndex: number) {
    this.connection.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<boolean[]> {

    // TODO: review

    if (!this.env.system.isInitialized) {
      this.env.log.warn(`PortExpanderDriver.poll(). It runs before app is initialized`);
    }

    console.log('------- poll');

    // init IC if it isn't inited at this moment
    if (!this.wasIcInited) await this.initIc();

    await this.connection.poll();
    this.setLastReceivedState();

    return this.getValues();
  }

  async getPinMode(pin: number): Promise<PortExpanderPinMode | undefined> {
    //this.connection
    // TODO: make requrest or just read

    // if (this.directions[pin] === DIR_IN) {
    //   return 'input';
    // }
    // else if (this.directions[pin] === DIR_OUT) {
    //   return 'output';
    // }

    // undefined means didn't specify
    return;
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false]
   */
  getValues(): boolean[] {

    // TODO: make request
    // TODO: make promise and in pcf too

    //return byteToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  async read(pin: number): Promise<boolean> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      return false;
    }

    // TODO: read from expander

    //return ((this.currentState>>pin) % 2 !== 0);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   - The pin number. e.g 0 to 16
   * @param  {boolean} value - The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('Pin out of range');
    }

    const dataToSend: Uint8Array = new Uint8Array(3);

    dataToSend[0] = COMMANDS.setOutputValue;
    dataToSend[1] = this.getHexPinNumber(pin);
    dataToSend[2] = (value) ? DIGITAL_VALUE.high : DIGITAL_VALUE.low;

    await this.connection.write(undefined, dataToSend);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(values: boolean[]): Promise<void> {

    // TODO: review

    // let newState: number = this.currentState;
    //
    // for (let pin = 0; pin <= this.getLastPinNum(); pin++) {
    //   if (this.directions[pin] !== DIR_OUT) {
    //     // isn't an output pin
    //     continue;
    //   }
    //
    //   newState = this.updatePinInBitMask(newState, pin, values[pin]);
    // }
    //
    // this.currentState = newState;
    //
    // return this.writeToIc();
  }

  /**
   * Do first write to IC if it doesn't do before.
   */
  private async initIc() {
    try {
      await this.writePinModes(this.pinModes);
    }
    catch (err) {
      this.env.log.error(`PortExpander.driver. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    // write output values initial values
    try {
      await this.writeOutputValues(this.initialOutputValues);
    }
    catch (err) {
      this.env.log.error(`PortExpander.driver. Can't write initial output values to IC, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }

  private async writePinModes(pinModes: {[index: string]: number}) {
    const dataToSend: Uint8Array = new Uint8Array(this.props.pinCount + 1);

    dataToSend[0] = COMMANDS.setupAll;

    for (let i = 0; i < this.props.pinCount; i++) {
      if (pinModes[i]) {
        dataToSend[i + 1] = pinModes[i];
      }
      else {
        dataToSend[i + 1] = NO_MODE;
      }
    }

    await this.connection.write(undefined, dataToSend);
  }

  private async writeOutputValues(outputValues: {[index: string]: boolean}) {

    await this.connection.write(undefined, dataToSend);
  }

  private getHexPinNumber(pin: number): number {
    return pin + 48;
  }


  private setLastReceivedState() {

    // TODO: review

    const lastData: Uint8Array | undefined = this.connection.getLastData();

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

  // /**
  //  * Write the current state to the IC.
  //  * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
  //  */
  // private async writeToIc () {
  //   // it means that IC is inited when first data is written
  //   this.wasIcInited = true;
  //
  //   // set all input pins to high
  //   const newIcState = this.currentState | this.inputPinBitmask;
  //   const dataToSend: Uint8Array = new Uint8Array(1);
  //
  //   // send one byte to IC
  //   dataToSend[0] = newIcState;
  //
  //   await this.connection.write(undefined, dataToSend);
  // }

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

  protected validateProps = (props: ExpanderDriverProps): string | undefined => {

    // if(address < 0 || address > 255){
    //   throw new Error('Address out of range');
    // }

    return;
  }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {

  // TODO: review - может быть и wifi и ble

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
  protected DriverClass = PCF8574Driver;
}
