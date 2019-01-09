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
import {getKeyOfObject} from '../../helpers/helpers';
import {convertBitsToBytes, convertBytesToBits, hexToBytes, numToWord} from '../../helpers/binaryHelpers';
import {cloneDeep, isEqual, omit} from '../../helpers/lodashLike';
import DriverBase from '../../app/entities/DriverBase';
import NodeDriver, {NodeHandler} from '../../app/interfaces/NodeDriver';
import {ASCII_NUMERIC_OFFSET, BYTES_IN_WORD} from '../../app/dict/constants';
import {PinMode} from '../../app/interfaces/dev/Digital';


export interface ExpanderDriverProps {
  // count of all the pins of expander
  //allPinCount: number;
  digitalPinsCount: number;
  analogPinsCount: number;
  // connection params
  [index: string]: any;
}

type DigitalState = (boolean | undefined)[];
type AnalogState = (number | undefined)[];

export interface State {
  // array like [true, undefined, false, ...]. Indexes are pin numbers, undefined is for not input pins
  inputs: DigitalState;
  outputs: DigitalState;
  // indexes are analog pin numbers from 0
  analogInputs: AnalogState;
  analogOutputs: AnalogState;
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


//export type ResultHandler = (state?: State) => void;

export type DigitalPinHandler = (targetPin: number, value: boolean) => void;
export type AnalogPinHandler = (targetPin: number, value: number) => void;


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
  private readonly handlers: (DigitalPinHandler | AnalogPinHandler)[] = [];

  private get node(): NodeDriver {
    return this.depsInstances.node as NodeDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {

    // TODO: choose driver

    this.depsInstances.node = await getDriverDep('I2cNode.driver')
      .getInstance({
        ...omit(this.props, 'digitalPinsCount', 'analogPinsCount'),
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
    // init IC state after app is inited if it isn't inited at this moment
    await this.initIcIfNeed();

    // write output digital initial values
    try {
      await this.writeDigitalOutputStateToIc();
    }
    catch (err) {
      this.env.log.warn(`PortExpanderDriver init. Can't write initial digital output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }

    // write output analog initial values
    try {
      await this.writeAnalogOutputStateToIc();
    }
    catch (err) {
      this.env.log.warn(`PortExpanderDriver init. Can't write initial analog output values to IC. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }

  getState(): State {
    return this.state;
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setupDigital(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    if (this.wasIcInited) {
      // TODO: don't use system
      this.env.system.log.warn(`PortExpanderDriver.setup: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('PortExpanderDriver.setupDigital: Pin out of range');
    }

    if (pinMode === 'output') {
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.state.outputs[pin] = outputInitialValue;
    }

    this.pinModes[pin] = MODES[pinMode];
  }

  async setupAnalog(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    if (this.wasIcInited) {
      // TODO: don't use system
      this.env.system.log.warn(`PortExpanderDriver.setup: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin > this.getLastAnalogPinNum()) {
      throw new Error('PortExpanderDriver.setupAnalog: Analog pin out of range');
    }

    if (pinMode === 'analog_output') {
      this.state.analogOutputs[pin] = outputInitialValue;
    }

    this.pinModes[pin] = MODES[pinMode];
  }

  addDigitalListener(handler: DigitalPinHandler): string {
    const wrapper: NodeHandler = () => {
      const lastState: State = cloneDeep(this.state);

      this.setLastReceivedState();

      // do not rise an event if state doesn't changed
      if (isEqual(lastState, this.state)) return;

      handler(this.getState());
    };

    return this.node.addListener(wrapper);

    //this.handlers.push();
  }

  addAnalogListener(handler: AnalogPinHandler): string {
    //this.handlers.push();

    // TODO: !!! make it
  }

  // // TODO: что слушаем ??? любые изменения или только digital, analog etc?
  // /**
  //  * Add listener to listen to changes of any pin.
  //  */
  // addListener(handler: ResultHandler): number {
  //
  // }

  removeListener(handlerIndex: string) {

    // TODO: !!! make it
    // TODO: !!! support analog

    //this.node.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<void> {
    await this.initIcIfNeed();

    // TODO: review
    // TODO: review analog

    await this.node.poll();
    this.setLastReceivedState();
  }

  async getPinMode(pin: number): Promise<PortExpanderPinMode | undefined> {
    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('PortExpanderDriver.getPinMode: Pin out of range');
    }

    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderPinMode | undefined;
  }

  /**
   * Returns the current value of a digital pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call poll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  async readDigital(pin: number): Promise<boolean> {
    this.checkPin(pin);
    await this.initIcIfNeed();

    if (!this.isDigitalPin(pin)) {
      throw new Error(`PortExpanderDriver.readDigital: pin "${pin}" hasn't been set up as a digital`);
    }

    // TODO: do poll only if there are any input pins

    if (this.pinModes[pin] === MODES.output) {
      return Boolean(this.state.outputs[pin]);
    }

    return Boolean(this.state.inputs[pin]);
  }

  /**
   * Set the value of an digital output pin.
   * @param  {number}  pin   - The pin number. e.g 0 to 16
   * @param  {boolean} value - The new value for this pin.
   * @return {Promise}
   */
  async writeDigital(pin: number, value: boolean): Promise<void> {
    this.checkPin(pin);
    await this.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.output) {
      throw new Error(`PortExpanderDriver.writeDigital: pin "${pin}" wasn't set as an digital output`);
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
  async writeDigitalState(outputState: DigitalState) {
    this.updateDigitalOutputValues(outputState);
    await this.writeDigitalOutputStateToIc();
  }

  async readAnalog(pin: number): Promise<number> {
    this.checkPin(pin);
    await this.initIcIfNeed();

    if (!this.isAnalogPin(pin)) {
      throw new Error(`PortExpanderDriver.readAnalog: pin "${pin}" hasn't been set up as an analog`);
    }

    if (this.pinModes[pin] === MODES.analog_output) {
      return this.state.analogOutputs[pin] || 0;
    }

    return this.state.analogInputs[pin] || 0;
  }

  async writeAnalog(pin: number, value: number): Promise<void> {
    this.checkPin(pin);
    await this.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.analog_output) {
      throw new Error(`PortExpanderDriver.writeAnalog: pin "${pin}" wasn't set as an analog output`);
    }

    const dataToSend: Uint8Array = new Uint8Array(2);
    const valueWord: string = numToWord(value);
    const int8ValueWord: Uint8Array = hexToBytes(valueWord);

    dataToSend[0] = this.getHexPinNumber(pin);
    dataToSend[1] = int8ValueWord[0];
    dataToSend[2] = int8ValueWord[1];

    await this.node.write(COMMANDS.setAnalogOutputValue, dataToSend);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeAnalogState(outputState: AnalogState): Promise<void> {
    this.updateAnalogOutputValues(outputState);
    await this.writeAnalogOutputStateToIc();
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

  private updateDigitalOutputValues(newValues: DigitalState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.output) {
        this.state.outputs[pinNum] = newValues[pinNum];
      }
    }
  }

  private updateAnalogOutputValues(newValues: AnalogState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.analog_output) {
        this.state.analogOutputs[pinNum] = newValues[pinNum];
      }
    }
  }

  /**
   * Write all the values of digital output pins to IC.
   */
  private async writeDigitalOutputStateToIc() {
    await this.initIcIfNeed();

    const dataToSend: Uint8Array = convertBitsToBytes(this.state.outputs, this.props.digitalPinsCount);

    console.log(222222222, this.props, dataToSend);

    await this.node.write(COMMANDS.setAllOutputValues, dataToSend);
  }

  /**
   * Write all the values of analog output pins to IC.
   */
  private async writeAnalogOutputStateToIc() {
    await this.initIcIfNeed();

    const dataToSend: Uint8Array = new Uint8Array(this.getLastAnalogPinNum() * BYTES_IN_WORD);

    for (let pinNumString in this.state.analogOutputs) {
      const pinNum: number = parseInt(pinNumString);

      if (typeof this.state.analogOutputs[pinNum] === 'undefined') continue;

      const valueWord: string = numToWord(Number(this.state.analogOutputs[pinNum]));
      const int8ValueWord: Uint8Array = hexToBytes(valueWord);

      dataToSend[pinNum * BYTES_IN_WORD] = int8ValueWord[0];
      dataToSend[pinNum * BYTES_IN_WORD + 1] = int8ValueWord[1];
    }

    await this.node.write(COMMANDS.setAllAnalogOutputValues, dataToSend);
  }

  private isDigitalPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.output || this.isInputPin(pin);
  }

  private isInputPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.input || pinMode === MODES.input_pullup || pinMode === MODES.input_pulldown;
  }

  private isAnalogPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.analog_output || pinMode === MODES.analog_input;
  }

  private getLastPinNum(): number {
    return this.props.digitalPinsCount - 1;
  }

  private getLastAnalogPinNum(): number {
    return this.props.analogPinsCount - 1;
  }

  private getHexPinNumber(pin: number): number {
    return pin + ASCII_NUMERIC_OFFSET;
  }

  /**
   * Write pin modes to IC if it isn't initialized before.
   */
  private async initIcIfNeed() {
    if (this.wasIcInited || this.initingIcInProgress) return;

    this.initingIcInProgress = true;

    try {
      await this.writePinModes();
    }
    catch (err) {
      this.env.log.error(`PortExpanderDriver.initIc. Can't init IC state. Props are "${JSON.stringify(this.props)}". ${String(err)}`);
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

    await this.node.write(COMMANDS.setupAll, dataToSend);
  }

  private setLastReceivedState() {

    // TODO: review - what about analog ?

    const lastData: Uint8Array | undefined = this.node.getLastData();

    if (!lastData) return;

    const newState: DigitalState = convertBytesToBits(lastData);

    console.log(11111111, 'current - ', this.state.inputs, ' | new - ', lastData, ' | parsed - ', newState);

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
