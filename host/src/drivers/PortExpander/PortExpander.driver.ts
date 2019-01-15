/*
 * Driver for port expander based on microcontroller.
 * It supports the next types of connection:
 * * I2C
 * * Serial
 * * ?LAN
 * * ?Wifi
 * * ?Bluetooth
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {firstLetterToUpperCase} from '../../helpers/helpers';
import DriverBase from '../../app/entities/DriverBase';
import DuplexDriver from '../../app/interfaces/DuplexDriver';
import {ASCII_NUMERIC_OFFSET, BITS_IN_BYTE} from '../../app/dict/constants';
import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import DigitalPins, {DigitalPinHandler} from './DigitalPins';
import AnalogPins, {AnalogPinHandler} from './AnalogPins';
import State, {AnalogState, DigitalState, ExpanderState} from './State';
import Logger from '../../app/interfaces/Logger';
import {omit} from '../../helpers/lodashLike';
import {PollProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';
import {uint8WordToNum} from '../../helpers/binaryHelpers';


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
export type PortExpanderDigitalPinMode = 'input' | 'input_pullup' | 'input_pulldown' | 'output';
export type PortExpanderAnalogPinMode = 'analog_input' | 'analog_output';

export interface ExpanderDriverProps {
  connection: PortExpanderConnection;
  digitalPinsCount: number;
  analogPinsCount: number;
  // connection params
  [index: string]: any;
}


export const COMMANDS = {
  getDigitalMode:             0x30,
  getAllDigitalModes:         0x31,
  setupDigital:               0x32,
  setupAllDigital:            0x33,
  setDigitalOutputValue:      0x34,
  setAllDigitalOutputValues:  0x35,
  readDigital:                0x36,
  readAllDigital:             0x37,

  getAnalogMode:              0x40,
  getAllAnalogModes:          0x41,
  setupAnalog:                0x42,
  setupAllAnalog:             0x43,
  setAnalogOutputValue:       0x44,
  setAllAnalogOutputValues:   0x45,
  readAnalog:                 0x46,
  readAllAnalog:              0x47,

  // 50+ pwm
  // 60+ serial

  // setDigitalEdge:             0x36,
  // setAllDigitalEdges:         0x37,
  // setDigitalDebounce:         0x38,
  // setAllDigitalDebounce:      0x39,

  //setAnalogDebounce:          0x47,
  //setAllAnalogDebounce:       0x48,
};

export const MODES = {
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

const INCOME_COMMANDS = {
  // 2 bytes - all the states
  newAllDigitalState: 0x30,
  // 3 bytes - pin number, 2 bytes value
  newAnalogPinState:  0x31,
};

export const NO_MODE = 0x21;


// TODO: не делать публичное то что не нужно

export class PortExpanderDriver extends DriverBase<ExpanderDriverProps> {
  wasIcInited: boolean = false;
  readonly state: State = new State(this);
  // TODO: does it really need?
  readonly log: Logger = this.env.system.log;
  get node(): DuplexDriver {
    return this.depsInstances.node as DuplexDriver;
  }

  readonly digitalPins: DigitalPins = new DigitalPins(this);
  readonly analogPins: AnalogPins = new AnalogPins(this);
  private initingIcInProgress: boolean = false;


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = `${firstLetterToUpperCase(this.props.connection)}Duplex.driver`;

    const props = {
      ...omit(this.props, 'connection', 'digitalPinsCount', 'analogPinsCount'),
      poll: <PollProps[]>[],
    };

    if (this.props.connection === 'i2c') {
      const digitalBytesCount: number = Math.ceil(this.props.digitalPinsCount / BITS_IN_BYTE);

      props.poll.push({dataAddress: INCOME_COMMANDS.newAllDigitalState, dataLength: digitalBytesCount});
      props.poll.push({dataAddress: INCOME_COMMANDS.newAnalogPinState,  dataLength: 3});
    }

    this.depsInstances.node = await getDriverDep(driverName).getInstance(props);
  }

  protected didInit = async () => {
    // Listen to received data
    this.node.onReceive((dataAddressStr: number | string, data: Uint8Array) => {
      if (typeof dataAddressStr === 'undefined') {
        this.env.system.log.error(`PortExpanderDriver: No command have been received from node. Props are: ${JSON.stringify(this.props)}`);
      }
      else if (dataAddressStr === INCOME_COMMANDS.newAllDigitalState) {
        this.state.updateDigitalState(data);
      }
      else if (dataAddressStr === INCOME_COMMANDS.newAnalogPinState) {
        // first byte is pin number with 48 position shift
        const pinNumber: number = this.hexPinToNumber(data[0]);
        // 2nd and 3rd are word which represent a 16bit number
        const value: number = uint8WordToNum(new Uint8Array([data[1], data[2]]));

        this.state.setAnalogInput(pinNumber, value);
      }
      else {
        this.env.system.log.error(`PortExpanderDriver: Unknown command "${dataAddressStr}" have been received from node. Props are: ${JSON.stringify(this.props)}`);
      }
    });
  }

  protected appDidInit = async () => {
    // init IC state after app is inited if it isn't inited at this moment
    await this.initIcIfNeed();
  }


  getState(): ExpanderState {
    return this.state.getAllState();
  }

  async getDigitalPinMode(pin: number): Promise<PortExpanderDigitalPinMode | undefined> {
    return this.digitalPins.getPinMode(pin);
  }

  async getAnalogPinMode(pin: number): Promise<PortExpanderAnalogPinMode | undefined> {
    return this.analogPins.getPinMode(pin);
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  setupDigital(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    return this.digitalPins.setup(pin, pinMode, outputInitialValue);
  }

  addDigitalListener(handler: DigitalPinHandler): number {
    return this.state.digitalEvents.addListener(handler);
  }

  removeDigitalListener(handlerIndex: number) {
    this.state.digitalEvents.removeListener(handlerIndex);
  }

  /**
   * Returns the current value of a digital pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call poll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  readDigital(pin: number): Promise<boolean> {
    return this.digitalPins.read(pin);
  }

  /**
   * Set the value of an digital output pin.
   * @param  {number}  pin   - The pin number. e.g 0 to 16
   * @param  {boolean} value - The new value for this pin.
   * @return {Promise}
   */
  writeDigital(pin: number, value: boolean): Promise<void> {
    return this.digitalPins.write(pin, value);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  writeDigitalState(outputState: DigitalState) {
    return this.digitalPins.writeState(outputState);
  }


  setupAnalog(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    return this.analogPins.setup(pin, pinMode, outputInitialValue);
  }

  addAnalogListener(handler: AnalogPinHandler): number {
    return this.state.analogEvents.addListener(handler);
  }

  removeAnalogListener(handlerIndex: number) {
    this.state.analogEvents.removeListener(handlerIndex);
  }

  readAnalog(pin: number): Promise<number> {
    return this.analogPins.read(pin);
  }

  writeAnalog(pin: number, value: number): Promise<void> {
    return this.analogPins.write(pin, value);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeAnalogState(outputState: AnalogState): Promise<void> {
    return this.analogPins.writeState(outputState);
  }


  /**
   * Write pin modes to IC if it isn't initialized before.
   */
  async initIcIfNeed() {
    if (this.wasIcInited) return;

    this.initingIcInProgress = true;
    const hasDigitalOutputPins = this.digitalPins.hasOutputPins();
    const hasAnalogOutputPins = this.analogPins.hasOutputPins();

    // write digital pin modes
    if (hasDigitalOutputPins) {
      try {
        await this.digitalPins.writePinModes();
      }
      catch (err) {
        this.initingIcInProgress = false;

        throw new Error(`PortExpanderDriver.initIc. Can't init digital IC state. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
      }
    }

    // write analog pin modes
    if (hasAnalogOutputPins) {
      try {
        await this.analogPins.writePinModes();
      }
      catch (err) {
        this.initingIcInProgress = false;

        throw new Error(`PortExpanderDriver.initIc. Can't init analog IC state. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
      }
    }

    // write output digital initial values
    if (hasAnalogOutputPins) {
      try {
        await this.digitalPins.writeOutputStateToIc();
      }
      catch (err) {
        this.env.log.warn(`PortExpanderDriver init. Can't write initial digital output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
      }
    }

    // write output analog initial values
    if (hasDigitalOutputPins) {
      try {
        await this.analogPins.writeOutputStateToIc();
      }
      catch (err) {
        this.env.log.warn(`PortExpanderDriver init. Can't write initial analog output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
      }
    }

    this.initingIcInProgress = false;
    this.wasIcInited = true;
  }

  checkInitialization(method: string): boolean {
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

  getHexPinNumber(pin: number): number {
    return pin + ASCII_NUMERIC_OFFSET;
  }

  hexPinToNumber(pinHex: number): number {
    return pinHex - ASCII_NUMERIC_OFFSET;
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
  // TODO: review - может быть и wifi и ble и их адреса

  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   const bus: string = (props.bus) ? String(props.bus) : 'default';
  //
  //   return `${bus}-${props.address}`;
  // }
  protected DriverClass = PortExpanderDriver;
}
