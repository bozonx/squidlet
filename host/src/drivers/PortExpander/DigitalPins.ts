import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import {DigitalPinHandler, PortExpanderDriver} from './PortExpander.driver';
import {convertBitsToBytes} from '../../helpers/binaryHelpers';
import IndexedEvents from '../../helpers/IndexedEvents';


export type DigitalState = (boolean | undefined)[];


export default class DigitalPins {
  inputStates: DigitalState = [];
  outputStates: DigitalState = [];
  
  private readonly expander: PortExpanderDriver;
  
  
  readonly events: IndexedEvents = new IndexedEvents();
  
  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }

  init() {

  }


  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setupDigital(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    if (this.wasIcInited) {
      // TODO: don't use system
      this.env.system.log.warn(`PortExpanderDriver.setupDigital: can't setup pin "${pin}" because IC was already initialized`);

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

  addDigitalListener(handler: DigitalPinHandler): number {
    return this.events.addListener(handler);
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

    if (!this.isDigitalPin(pin)) {
      throw new Error(`PortExpanderDriver.readDigital: pin "${pin}" hasn't been set up as a digital`);
    }

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
    if (!this.checkInitialization('writeDigital')) return;

    this.checkPin(pin);
    await this.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.output) {
      throw new Error(`PortExpanderDriver.writeDigital: pin "${pin}" wasn't set as an digital output`);
    }

    const dataToSend: Uint8Array = new Uint8Array(2);

    dataToSend[0] = this.getHexPinNumber(pin);
    dataToSend[1] = (value) ? DIGITAL_VALUE.high : DIGITAL_VALUE.low;

    await this.expander.node.send(COMMANDS.setOutputValue, dataToSend);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  async writeDigitalState(outputState: DigitalState) {
    if (!this.checkInitialization('writeDigitalState')) return;

    await this.initIcIfNeed();

    this.updateDigitalOutputValues(outputState);
    await this.writeOutputStateToIc();
  }


  /**
   * Write all the values of digital output pins to IC.
   */
  async writeOutputStateToIc() {
    const dataToSend: Uint8Array = convertBitsToBytes(this.state.outputs, this.props.digitalPinsCount);

    console.log(222222222, this.props, dataToSend);

    await this.expander.node.send(COMMANDS.setAllOutputValues, dataToSend);
  }

  private updateDigitalOutputValues(newValues: DigitalState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.output) {
        this.state.outputs[pinNum] = newValues[pinNum];
      }
    }
  }

  private isDigitalPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.output || this.isInputPin(pin);
  }

  // TODO: rename to isDigitalInput
  private isInputPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.input || pinMode === MODES.input_pullup || pinMode === MODES.input_pulldown;
  }

  // TODO: rename to getLastDigitalPinNum
  private getLastPinNum(): number {
    return this.props.digitalPinsCount - 1;
  }

}
