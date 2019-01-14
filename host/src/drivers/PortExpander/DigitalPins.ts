import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import {COMMANDS, MODES, PortExpanderDriver} from './PortExpander.driver';
import {convertBitsToBytes} from '../../helpers/binaryHelpers';
import {DigitalState} from './State';


export type DigitalPinHandler = (targetPin: number, value: boolean) => void;

const DIGITAL_VALUE = {
  low: 0x30,
  high: 0x31,
};


export default class DigitalPins {
  private readonly expander: PortExpanderDriver;
  

  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }


  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setupDigital(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupDigital: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('PortExpanderDriver.setupDigital: Pin out of range');
    }

    if (pinMode === 'output') {
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.expander.state.setDigitalOutput(pin, outputInitialValue);
    }

    this.expander.pinModes[pin] = MODES[pinMode];
  }

  /**
   * Write all the pin modes to IC.
   */
  async writePinModes() {

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

  /**
   * Returns the current value of a digital pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call poll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  async readDigital(pin: number): Promise<boolean> {
    this.expander.checkPin(pin);

    if (!this.isDigitalPin(pin)) {
      throw new Error(`PortExpanderDriver.readDigital: pin "${pin}" hasn't been set up as a digital`);
    }

    if (this.expander.pinModes[pin] === MODES.output) {
      return Boolean(this.expander.state.getDigitalOutput(pin));
    }

    return Boolean(this.expander.state.getDigitalInput(pin));
  }

  /**
   * Set the value of an digital output pin.
   * @param  {number}  pin   - The pin number. e.g 0 to 16
   * @param  {boolean} value - The new value for this pin.
   * @return {Promise}
   */
  async writeDigital(pin: number, value: boolean): Promise<void> {
    if (!this.expander.checkInitialization('writeDigital')) return;

    this.expander.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.expander.pinModes[pin] !== MODES.output) {
      throw new Error(`PortExpanderDriver.writeDigital: pin "${pin}" wasn't set as an digital output`);
    }

    const dataToSend: Uint8Array = new Uint8Array(2);

    dataToSend[0] = this.expander.getHexPinNumber(pin);
    dataToSend[1] = (value) ? DIGITAL_VALUE.high : DIGITAL_VALUE.low;

    await this.expander.node.send(COMMANDS.setOutputValue, dataToSend);
  }

  /**
   * Set new state of all the output pins.
   * Not output pins (input, undefined) are ignored.
   */
  async writeDigitalState(outputState: DigitalState) {
    if (!this.expander.checkInitialization('writeDigitalState')) {
      return;
    }
    else if (!this.hasOuputPins()) {
      this.expander.log.warn(`Trying to write digital state to expander but there isn't configured digital output pins`);

      return;
    }

    await this.expander.initIcIfNeed();

    this.updateDigitalOutputValues(outputState);
    await this.writeOutputStateToIc();
  }

  /**
   * Write all the values of digital output pins to IC.
   */
  async writeOutputStateToIc() {
    const dataToSend: Uint8Array = convertBitsToBytes(
      this.expander.state.getAllState().outputs,
      this.expander.props.digitalPinsCount
    );

    await this.expander.node.send(COMMANDS.setAllOutputValues, dataToSend);
  }

  // TODO: make private
  isInputPin(pin: number): boolean {
    const pinMode: number | undefined = this.expander.pinModes[pin];

    return pinMode === MODES.input || pinMode === MODES.input_pullup || pinMode === MODES.input_pulldown;
  }

  hasOuputPins(): boolean {
    // TODO: add
  }


  private updateDigitalOutputValues(newValues: DigitalState) {
    for (let pinNum in newValues) {
      if (this.expander.pinModes[pinNum] === MODES.output) {
        this.expander.state.setDigitalOutput(parseInt(pinNum), Boolean(newValues[pinNum]));
      }
    }
  }

  private isDigitalPin(pin: number): boolean {
    const pinMode: number | undefined = this.expander.pinModes[pin];

    return pinMode === MODES.output || this.isInputPin(pin);
  }

  private getLastPinNum(): number {
    return this.expander.props.digitalPinsCount - 1;
  }

}
