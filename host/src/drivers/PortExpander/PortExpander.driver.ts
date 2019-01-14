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
import {firstLetterToUpperCase, getKeyOfObject} from '../../helpers/helpers';
import DriverBase from '../../app/entities/DriverBase';
import DuplexDriver from '../../app/interfaces/DuplexDriver';
import {ASCII_NUMERIC_OFFSET} from '../../app/dict/constants';
import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import DigitalPins, {DigitalPinHandler} from './DigitalPins';
import AnalogPins, {AnalogPinHandler} from './AnalogPins';
import State, {AnalogState, DigitalState, ExpanderState} from './State';
import Logger from '../../app/interfaces/Logger';
import {omit} from '../../helpers/lodashLike';
import {PollProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';


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

// TODO: review commands - add set debounce, edge, setup analog, setup all analog
export const COMMANDS = {
  setup:                    0x30,
  setupAll:                 0x31,
  setOutputValue:           0x32,
  setAllOutputValues:       0x33,
  readDigital:              0x34,
  readAllDigital:           0x35,
  setAnalogOutputValue:     0x36,
  setAllAnalogOutputValues: 0x37,
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
  newDigitalState: 0x30,
  newAnalogState: 0x31,
};

const NO_MODE = 0x21;


// TODO: не делать публичное то что не нужно

export class PortExpanderDriver extends DriverBase<ExpanderDriverProps> {
  // pin modes which are set at init time.
  pinModes: number[] = [];
  wasIcInited: boolean = false;
  readonly state: State = new State();
  // TODO: does it really need?
  readonly log: Logger = this.env.system.log;
  get node(): DuplexDriver {
    return this.depsInstances.node as DuplexDriver;
  }

  private readonly digitalPins: DigitalPins = new DigitalPins(this);
  private readonly analogPins: AnalogPins = new AnalogPins(this);
  private initingIcInProgress: boolean = false;


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = `${firstLetterToUpperCase(this.props.connection)}Duplex.driver`;

    const props = {
      ...omit(this.props, 'connection', 'digitalPinsCount', 'analogPinsCount'),
      poll: <PollProps[]>[],
    };

    if (this.props.connection === 'i2c') {
      props.poll.push({dataAddress: INCOME_COMMANDS.newDigitalState, dataLength: this.props.digitalPinsCount});
      props.poll.push({dataAddress: INCOME_COMMANDS.newAnalogState,  dataLength: this.props.analogPinsCount});
    }

    this.depsInstances.node = await getDriverDep(driverName)
      .getInstance(props);
  }

  protected didInit = async () => {
    this.node.onReceive((dataAddressStr: number | string, data: Uint8Array) => {
      if (typeof dataAddressStr === 'undefined') {
        this.env.system.log.error(`PortExpanderDriver: No command have been received from node. Props are: ${JSON.stringify(this.props)}`);
      }
      else if (dataAddressStr === INCOME_COMMANDS.newDigitalState) {
        this.state.updateDigitalState(data);
      }
      else if (dataAddressStr === INCOME_COMMANDS.newAnalogState) {
        this.state.updateAnalogState(data);
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

  async getPinMode(pin: number): Promise<PortExpanderPinMode | undefined> {
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
    return this.state.analogEvents.addListener(handler);
  }

  removeAnalogListener(handlerIndex: number) {
    this.state.analogEvents.removeListener(handlerIndex);
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
   * Write pin modes to IC if it isn't initialized before.
   */
  async initIcIfNeed() {
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

    // TODO: тольео если есть digital pins
    // write output digital initial values
    try {
      await this.digitalPins.writeOutputStateToIc();
    }
    catch (err) {
      this.env.log.warn(`PortExpanderDriver init. Can't write initial digital output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    // TODO: тольео если есть analog pins
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

  checkPin(pin: number) {
    if (typeof this.pinModes[pin] === 'undefined') {
      throw new Error(`PortExpanderDriver: pin "${pin}" hasn't been set up`);
    }
  }

  getHexPinNumber(pin: number): number {
    return pin + ASCII_NUMERIC_OFFSET;
  }


  /**
   * Write all the pin modes to IC.
   */
  private async writePinModes() {

    // TODO: review - move to analog and digital - отдельными запросами
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
