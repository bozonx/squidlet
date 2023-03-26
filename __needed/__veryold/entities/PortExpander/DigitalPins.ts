import {DigitalInputMode, DigitalPinMode} from 'interfaces/io/DigitalIo';
import {bitsToBytes} from 'lib/binaryHelpers';
import {getKeyOfObject} from 'lib/objects';
import {makeSizedArray} from 'lib/arrays';

import {
  COMMANDS,
  MODES, NO_MODE,
  PortExpander,
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/PortExpander.js';
import {DigitalState} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/State.js';


export type DigitalPinHandler = (targetPin: number, value: boolean) => void;

const DIGITAL_VALUE = {
  low: 0x30,
  high: 0x31,
};


export default class DigitalPins {
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private readonly expander: PortExpander;


  constructor(expander: PortExpander) {
    this.expander = expander;
  }


  getPinMode(pin: number): DigitalPinMode | undefined {
    const pinModeByte: number = this.pinModes[pin];
    const pinMode = getKeyOfObject(MODES, pinModeByte) as DigitalPinMode | undefined;

    if (pinMode === 'input'
      || pinMode === 'input_pullup'
      || pinMode === 'input_pulldown'
      || pinMode === 'output'
    ) return pinMode as DigitalPinMode;

    return;
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setupInput(pin: number, pinMode: DigitalInputMode, debounce?: number, edge?: Edge): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupDigital: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin >= this.expander.props.digitalPinsCount) {
      throw new Error('PortExpanderDriver.setupDigital: Pin out of range');
    }

    // TODO: save debounce and edge to send it to IC

    if (this.isDigitalInputMode(pin)) {
      this.pinModes[pin] = MODES[pinMode];
    }
    else {
      throw new Error(`Unsupported mode "${pinMode}" of digital input pin "${pin}"`);
    }
  }

  /**
   * Setup digital input or output pin.
   * Please set pin mode once on startup.
   */
  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupDigital: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin >= this.expander.props.digitalPinsCount) {
      throw new Error('PortExpanderDriver.setupDigital: Pin out of range');
    }

    // set value to local state or use default value
    this.expander.state.setDigitalOutput(pin, outputInitialValue || false);

    this.pinModes[pin] = MODES['output'];
  }

  /**
   * Write all the pin modes to IC.
   */
  async writePinModes() {
    const pinCount = this.expander.props.digitalPinsCount;
    const dataToSend: Uint8Array = new Uint8Array(pinCount);

    for (let i = 0; i < pinCount; i++) {
      if (typeof this.pinModes[i] === 'undefined') {
        dataToSend[i] = NO_MODE;
      }
      else {
        dataToSend[i] = this.pinModes[i];
      }
    }

    await this.expander.node.send(COMMANDS.setupAllDigital, dataToSend);
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

    // TODO: наверное тоже нужне tmpState как в pcf экспандере - тоже в analog ???


    this.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.output) {
      throw new Error(`PortExpanderDriver.writeDigital: Can't write to not digital output pin "${pin}"`);
    }

    const dataToSend: Uint8Array = new Uint8Array(2);

    dataToSend[0] = this.expander.getHexPinNumber(pin);
    dataToSend[1] = (value) ? DIGITAL_VALUE.high : DIGITAL_VALUE.low;

    await this.expander.node.send(COMMANDS.setDigitalOutputValue, dataToSend);
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
    //const bits: DigitalState = new Array(this.expander.props.digitalPinsCount);
    const bits: DigitalState = makeSizedArray(
      this.expander.state.getAllState().outputs,
      this.expander.props.digitalPinsCount
    );

    const dataToSend: Uint8Array = bitsToBytes(bits);

    await this.expander.node.send(COMMANDS.setAllDigitalOutputValues, dataToSend);
  }

  hasOutputPins(): boolean {
    return this.pinModes.includes(MODES.output);
  }


  // TODO: make private
  isInputPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return this.isDigitalInputMode(pinMode);
  }


  private isDigitalInputMode(mode: number | undefined): boolean {
    return mode === MODES.input || mode === MODES.input_pullup || mode === MODES.input_pulldown;
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
