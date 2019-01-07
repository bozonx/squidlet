/*
 * Driver for port expander based on arduino.
 * It supports the next types of connection:
 * * I2C
 * * Serial
 * * LAN
 * * Wifi
 * * Bluetooth
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {getKeyOfObject, updateBitInByte} from '../../helpers/helpers';
import {omit} from '../../helpers/lodashLike';
import DriverBase from '../../app/entities/DriverBase';
import NodeDriver, {NodeHandler} from '../../app/interfaces/NodeDriver';


export interface ExpanderDriverProps {
  pinCount: number;
  // connection params
  [index: string]: any;
}

export interface State {
  // array like [true, undefined, false, ...]. Indexes are pin numbers, undefined is for not input pins
  inputs: (boolean | undefined)[];
  outputs: (boolean | undefined)[];
  // like {pinNum: value}
  analogInputs: {[index: string]: number};
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
export type ResultHandler = (state?: State) => void;


const COMMANDS = {
  setup:              0x30,
  setupAll:           0x31,
  setOutputValue:     0x32,
  setAllOutputValues: 0x33,
  readDigital:        0x34,
  readAllDigital:     0x35,
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


export class PortExpanderDriver extends DriverBase<ExpanderDriverProps> {
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private state: State = {
    inputs: [],
    outputs: [],
    analogInputs: {},
  };
  private wasIcInited: boolean = false;

  private get node(): NodeDriver {
    return this.depsInstances.node as NodeDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {

    // TODO: choose driver

    this.depsInstances.node = await getDriverDep('I2cNode.driver')
      .getInstance({
        ...omit(this.props, 'pinCount'),
        pollDataLength: 1,
        pollDataAddress: undefined,
      });
  }

  protected didInit = async () => {
    this.node.addPollErrorListener((err: Error) => {
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

  getState(): State {
    return this.state;
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

      this.state.outputs[pin] = outputInitialValue;
    }
    // else if (pinMode === 'input' || pinMode === 'input_pullup' || pinMode === 'input_pulldown') {
    //   this.state.inputs[pin] = false;
    // }
    // else {
    //   throw new Error(`Unsupported pin mode "${pinMode}"`);
    // }

    this.pinModes[pin] = MODES[pinMode];
  }

  // TODO: что слушаем ??? любые изменения или только digital, analog etc?
  /**
   * Add listener to listen to changes of any pin.
   */
  addListener(handler: ResultHandler): number {
    const wrapper: NodeHandler = () => {
      this.setLastReceivedState();

      // TODO: поидее если стейт не изменился то не поднимать событие, так как полинг будет делаться часто

      handler(this.getState());
    };

    return this.node.addListener(wrapper);
  }

  removeListener(handlerIndex: number) {
    this.node.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<void> {
    if (!this.wasIcInited) {
      throw new Error(`PortExpanderDriver.poll(). It runs before app IC is setup`);
    }

    await this.node.poll();
    this.setLastReceivedState();
  }

  async getPinMode(pin: number): Promise<PortExpanderPinMode | undefined> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('Pin out of range');
    }

    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderPinMode | undefined;
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call poll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  async readDigital(pin: number): Promise<boolean> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('Pin out of range');
    }

    // TODO: проверить что это именно digital pin

    // TODO: find it in state.inputs or state.outputs

    return true;
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

    const dataToSend: Uint8Array = new Uint8Array(2);

    dataToSend[0] = this.getHexPinNumber(pin);
    dataToSend[1] = (value) ? DIGITAL_VALUE.high : DIGITAL_VALUE.low;

    await this.node.write(COMMANDS.setOutputValue, dataToSend);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  async writeOutputValues(outputValues: boolean[]) {

    // TODO: test

    const numOfBytes: number = Math.ceil(this.props.pinCount / 8);
    const dataToSend: Uint8Array = new Uint8Array(numOfBytes);

    for (let i = 0; i < this.props.pinCount; i++) {
      // number of byte from 0
      const byteNum: number = Math.floor(i / 8);
      //const positionInByte: number = (Math.floor(i / 8) * 8);
      const positionInByte: number = i - (byteNum * 8);

      dataToSend[byteNum] = updateBitInByte(dataToSend[byteNum], positionInByte, outputValues[i]);
    }

    console.log(222222222, this.props, dataToSend);

    // TODO: add command

    await this.node.write(COMMANDS.setAllOutputValues, dataToSend);
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

    this.wasIcInited = true;
    //delete this.pinModes;
    //delete this.initialOutputValues;
  }

  private async writePinModes(pinModes: number[]) {
    const dataToSend: Uint8Array = new Uint8Array(this.props.pinCount);

    // TODO: pinMddes можно уже сформировать заранее

    for (let i = 0; i < this.props.pinCount; i++) {
      if (pinModes[i]) {
        dataToSend[i] = pinModes[i];
      }
      else {
        dataToSend[i] = NO_MODE;
      }
    }

    console.log(111111111, this.props, pinModes, dataToSend);

    await this.node.write(COMMANDS.setupAll, dataToSend);
  }

  private getHexPinNumber(pin: number): number {
    return pin + 48;
  }


  private setLastReceivedState() {
    const lastData: Uint8Array | undefined = this.node.getLastData();

    if (!lastData) return;

    // TODO: review

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', lastData[0].toString(2));
    // TODO: use it

    // TODO: ответ придет в виде байт


    this.currentState = lastData[0];


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


export default class Factory extends DriverFactoryBase<PortExpanderDriver> {

  protected instanceAlwaysNew = true;
  // TODO: review - может быть и wifi и ble

  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   const bus: string = (props.bus) ? String(props.bus) : 'default';
  //
  //   return `${bus}-${props.address}`;
  // }
  protected DriverClass = PortExpanderDriver;
}
