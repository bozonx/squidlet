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
import {callOnDifferentValues, getKeyOfObject} from '../../helpers/helpers';
import {convertBitsToBytes, convertBytesToBits, hexToBytes, numToWord} from '../../helpers/binaryHelpers';
import {cloneDeep} from '../../helpers/lodashLike';
import DriverBase from '../../app/entities/DriverBase';
import NodeDriver from '../../app/interfaces/NodeDriver';
import {ASCII_NUMERIC_OFFSET, BYTES_IN_WORD} from '../../app/dict/constants';
import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import IndexedEvents from '../../helpers/IndexedEvents';
import DigitalPins, {DigitalState} from './DigitalPins';
import AnalogPins, {AnalogState} from './AnalogPins';




export type DigitalPinHandler = (targetPin: number, value: boolean) => void;
export type AnalogPinHandler = (targetPin: number, value: number) => void;
export type PortExpanderConnection = 'i2c' | 'serial';
export type PortExpanderPinMode = 'input'
  | 'input_pullup'
  | 'input_pulldown'
  | 'output'
  | 'analog_input'
  | 'analog_output'
  | 'pwm'
  | 'rx'
  | 'tx';

export interface ExpanderDriverProps {
  connection: PortExpanderConnection;
  digitalPinsCount: number;
  analogPinsCount: number;
  // connection params
  [index: string]: any;
}

export interface State {
  // array like [true, undefined, false, ...]. Indexes are pin numbers, undefined is for not input pins
  inputs: DigitalState;
  outputs: DigitalState;
  // indexes are analog pin numbers from 0
  analogInputs: AnalogState;
  analogOutputs: AnalogState;
}


// TODO: review commands - add set debounce, edge, setup analog, setup all analog
const COMMANDS = {
  setup:                    0x30,
  setupAll:                 0x31,
  setOutputValue:           0x32,
  setAllOutputValues:       0x33,
  readDigital:              0x34,
  readAllDigital:           0x35,
  setAnalogOutputValue:     0x36,
  setAllAnalogOutputValues: 0x37,
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
  get node(): NodeDriver {
    return this.depsInstances.node as NodeDriver;
  }

  private readonly digitalPins: DigitalPins = new DigitalPins(this);
  private readonly analogPins: AnalogPins = new AnalogPins(this);
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private state: State = {
    inputs: [],
    outputs: [],
    analogInputs: [],
    analogOutputs: [],
  };
  private wasIcInited: boolean = false;
  private initingIcInProgress: boolean = false;


  protected willInit = async (getDriverDep: GetDriverDep) => {

    // TODO: choose driver - use connection
    // TODO: choose driver - setup driver - set pollDataAddress etc

    // this.depsInstances.node = await getDriverDep('I2cNode.driver')
    //   .getInstance({
    //     ...omit(this.props, 'digitalPinsCount', 'analogPinsCount'),
    //
    //     // TODO: почему 1 ???
    //     pollDataLength: 1,
    //     pollDataAddress: undefined,
    //   });
  }

  protected didInit = async () => {
    // this.node.addPollErrorListener((err: Error) => {
    //   this.env.log.error(String(err));
    // });

    this.node.onReceive(this.handleStateEvent);
  }

  protected appDidInit = async () => {
    // init IC state after app is inited if it isn't inited at this moment
    await this.initIcIfNeed();
  }

  getState(): State {
    return this.state;
  }

  // /**
  //  * Poll expander and return values of all the pins
  //  */
  // async poll(): Promise<void> {
  //
  //   // TODO: не нужно вообщето
  //
  //   if (!this.checkInitialization('poll')) return;
  //
  //   await this.initIcIfNeed();
  //
  //   // TODO: review
  //   // TODO: review analog
  //
  //   await this.node.poll();
  // }

  async getPinMode(pin: number): Promise<PortExpanderPinMode | undefined> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('PortExpanderDriver.getPinMode: Pin out of range');
    }

    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderPinMode | undefined;
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  setupDigital(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    return this.digitalPins.setupDigital(pin, pinMode, outputInitialValue);
  }

  addDigitalListener(handler: DigitalPinHandler): number {
    return this.digitalPins.addDigitalListener(handler);
  }

  removeListener(handlerIndex: string) {

    // TODO: !!! make it
    // TODO: !!! support analog

    //this.node.removeListener(handlerIndex);
  }

  /**
   * Returns the current value of a digital pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call poll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  readDigital(pin: number): Promise<boolean> {
    return this.digitalPins.readDigital(pin);
  }

  /**
   * Set the value of an digital output pin.
   * @param  {number}  pin   - The pin number. e.g 0 to 16
   * @param  {boolean} value - The new value for this pin.
   * @return {Promise}
   */
  writeDigital(pin: number, value: boolean): Promise<void> {
    return this.digitalPins.writeDigital(pin, value);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  writeDigitalState(outputState: DigitalState) {
    return this.digitalPins.writeDigitalState(outputState);
  }


  setupAnalog(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    return this.analogPins.setupAnalog(pin, pinMode, outputInitialValue);
  }

  addAnalogListener(handler: AnalogPinHandler): number {
    return this.analogPins.addAnalogListener(handler);
  }

  readAnalog(pin: number): Promise<number> {
    return this.analogPins.readAnalog(pin);
  }

  writeAnalog(pin: number, value: number): Promise<void> {
    return this.analogPins.writeAnalog(pin, value);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeAnalogState(outputState: AnalogState): Promise<void> {
    return this.analogPins.writeAnalogState(outputState);
  }


  /**
   * On change received data after poling on node driver.
   * Find changed pins and rise events on them.
   */
  private handleStateEvent(data: Uint8Array) {

    // TODO: может 1й байт будет коммандой???
    // TODO: помдее должен прийти весь стейт сразу

    const lastState: State = cloneDeep(this.state);

    this.setLastReceivedState(data);

    callOnDifferentValues(this.state.inputs, lastState.inputs, (pinNum: number, newValue: boolean) => {
      this.digitalPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.outputs, lastState.outputs, (pinNum: number, newValue: boolean) => {
      this.digitalPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.analogInputs, lastState.analogInputs, (pinNum: number, newValue: number) => {
      this.analogPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.analogOutputs, lastState.analogOutputs, (pinNum: number, newValue: number) => {
      this.analogPins.events.emit(pinNum, newValue);
    });
  }

  private checkPin(pin: number) {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error(`PortExpanderDriver: Pin "${pin}" out of range`);
    }

    const pinMode: number | undefined = this.pinModes[pin];

    if (typeof pinMode === 'undefined') {
      throw new Error(`PortExpanderDriver: pin "${pin}" hasn't been set up`);
    }
  }

  private checkInitialization(method: string): boolean {
    if (!this.initingIcInProgress) {
      this.env.log.warn(`PortExpanderDriver.${method}. IC initialization is in progress. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }
    else if (!this.env.system.isInitialized) {
      this.env.log.warn(`PortExpanderDriver.${method}. It runs before app is initialized. Props are: "${JSON.stringify(this.props)}"`);

      return false;
    }

    return true;
  }

  private getHexPinNumber(pin: number): number {
    return pin + ASCII_NUMERIC_OFFSET;
  }

  /**
   * Write pin modes to IC if it isn't initialized before.
   */
  private async initIcIfNeed() {
    if (this.wasIcInited) return;

    this.initingIcInProgress = true;

    // write pin modes
    try {
      await this.writePinModes();
    }
    catch (err) {
      this.initingIcInProgress = false;

      throw new Error(`PortExpanderDriver.initIc. Can't init IC state. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    // write output digital initial values
    try {
      await this.digitalPins.writeOutputStateToIc();
    }
    catch (err) {
      this.env.log.warn(`PortExpanderDriver init. Can't write initial digital output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    // write output analog initial values
    try {
      await this.analogPins.writeOutputStateToIc();
    }
    catch (err) {
      this.env.log.warn(`PortExpanderDriver init. Can't write initial analog output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    this.initingIcInProgress = false;
    this.wasIcInited = true;
  }

  /**
   * Write all the pin modes to IC.
   */
  private async writePinModes() {

    // TODO: review - allPinCount
    // TODO: review - write analog and digital modes - у ниъ разные пины

    const dataToSend: Uint8Array = new Uint8Array(this.props.allPinCount);

    for (let i = 0; i < this.props.allPinCount; i++) {
      if (typeof this.pinModes[i] === 'undefined') {
        dataToSend[i] = NO_MODE;
      }
      else {
        dataToSend[i] = this.pinModes[i];
      }
    }

    console.log(44444444444, this.props, this.pinModes, dataToSend);

    await this.node.send(COMMANDS.setupAll, dataToSend);
  }

  private setLastReceivedState(data: Uint8Array) {

    // TODO: review
    // TODO: what about analog ?
    // TODO: outputs тоже обновлять на всякий случай

    const newState: DigitalState = convertBytesToBits(data);

    console.log(11111111, 'current - ', this.state.inputs, ' | new - ', data, ' | parsed - ', newState);

    // update values
    for (let pinNum in newState) {
      // filter only inputs
      if (!this.isInputPin(parseInt(pinNum))) return;

      this.state.inputs[pinNum] = newState[pinNum];
    }
  }


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
