import {DigitalPinMode} from '../../app/interfaces/dev/Digital';
import {
  COMMANDS,
  MODES,
  PortExpanderDigitalPinMode,
  PortExpanderDriver,
} from './PortExpander.driver';
import {convertBitsToBytes} from '../../helpers/binaryHelpers';
import {DigitalState} from './State';
import {getKeyOfObject} from '../../helpers/helpers';


export type DigitalPinHandler = (targetPin: number, value: boolean) => void;

const DIGITAL_VALUE = {
  low: 0x30,
  high: 0x31,
};


export default class DigitalPins {
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private readonly expander: PortExpanderDriver;
  

  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }


  getPinMode(pin: number): PortExpanderDigitalPinMode | undefined {
    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderDigitalPinMode | undefined;
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setup(pin: number, pinMode: DigitalPinMode, outputInitialValue?: boolean): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupDigital: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin >= this.expander.props.digitalPinsCount) {
      throw new Error('PortExpanderDriver.setupDigital: Pin out of range');
    }

    if (pinMode === 'output') {
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.expander.state.setDigitalOutput(pin, outputInitialValue);
    }

    if (this.isDigitalPin(pin)) {
      this.pinModes[pin] = MODES[pinMode];
    }
    else {
      throw new Error(`Unsupported mode "${pinMode}" of digital pin "${pin}"`);
    }
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
  async read(pin: number): Promise<boolean> {
    this.checkPin(pin);

    if (!this.isDigitalPin(pin)) {
      throw new Error(`PortExpanderDriver.readDigital: pin "${pin}" hasn't been set up as a digital`);
    }

    if (this.pinModes[pin] === MODES.output) {
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
  async write(pin: number, value: boolean): Promise<void> {
    if (!this.expander.checkInitialization('writeDigital')) return;

    this.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.output) {
      throw new Error(`PortExpanderDriver.writeDigital: Can't write to not digital output pin "${pin}"`);
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
  async writeState(outputState: DigitalState) {
    if (!this.expander.checkInitialization('writeState')) {
      return;
    }
    else if (!this.hasOutputPins()) {
      this.expander.log.warn(`Trying to write digital state to expander but there isn't configured any digital output pins`);

      return;
    }

    await this.expander.initIcIfNeed();

    this.updateOutputValues(outputState);
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

  hasOutputPins(): boolean {
    return this.pinModes.includes(MODES.output);
  }


  // TODO: make private
  isInputPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.input || pinMode === MODES.input_pullup || pinMode === MODES.input_pulldown;
  }

  private updateOutputValues(newValues: DigitalState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.output) {
        this.expander.state.setDigitalOutput(parseInt(pinNum), Boolean(newValues[pinNum]));
      }
    }
  }

  private isDigitalPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.output || this.isInputPin(pin);
  }

  private checkPin(pin: number) {
    if (typeof this.pinModes[pin] === 'undefined') {
      throw new Error(`PortExpanderDriver: digital pin "${pin}" hasn't been set up`);
    }
  }

}
