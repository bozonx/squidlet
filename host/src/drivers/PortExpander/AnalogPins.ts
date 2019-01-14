import {
  COMMANDS,
  MODES,
  PortExpanderAnalogPinMode,
  PortExpanderDriver,
} from './PortExpander.driver';
import {hexToBytes, numToWord} from '../../helpers/binaryHelpers';
import {BYTES_IN_WORD} from '../../app/dict/constants';
import {AnalogState} from './State';
import {getKeyOfObject} from '../../helpers/helpers';


export type AnalogPinHandler = (targetPin: number, value: number) => void;


export default class AnalogPins {
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private readonly expander: PortExpanderDriver;

  
  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }


  getPinMode(pin: number): PortExpanderAnalogPinMode | undefined {
    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderAnalogPinMode | undefined;
  }

  async setup(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupAnalog: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin > this.getLastPinNum()) {
      throw new Error('PortExpanderDriver.setupAnalog: Analog pin out of range');
    }

    // save value
    if (pinMode === 'analog_output' && typeof outputInitialValue !== 'undefined') {
      this.expander.state.setAnalogOutput(pin, outputInitialValue);
    }

    if (this.isAnalogPin(pin)) {
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

  async read(pin: number): Promise<number> {
    this.checkPin(pin);

    if (!this.isAnalogPin(pin)) {
      throw new Error(`PortExpanderDriver.readAnalog: pin "${pin}" hasn't been set up as an analog`);
    }

    if (this.pinModes[pin] === MODES.analog_output) {
      return this.expander.state.getAnalogOutput(pin) || 0;
    }

    return this.expander.state.getAnalogInput(pin) || 0;
  }

  async write(pin: number, value: number): Promise<void> {
    if (!this.expander.checkInitialization('writeAnalog')) return;

    this.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.analog_output) {
      throw new Error(`PortExpanderDriver.writeAnalog: Can't write to not analog output pin "${pin}"`);
    }

    const dataToSend: Uint8Array = new Uint8Array(3);
    const valueWord: string = numToWord(value);
    const int8ValueWord: Uint8Array = hexToBytes(valueWord);

    dataToSend[0] = this.expander.getHexPinNumber(pin);
    dataToSend[1] = int8ValueWord[0];
    dataToSend[2] = int8ValueWord[1];

    await this.expander.node.send(COMMANDS.setAnalogOutputValue, dataToSend);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeAnalogState(outputState: AnalogState): Promise<void> {
    if (!this.expander.checkInitialization('writeAnalogState')) return;

    await this.expander.initIcIfNeed();

    this.updateAnalogOutputValues(outputState);
    await this.writeOutputStateToIc();
  }

  hasOutputPins(): boolean {
    return this.pinModes.includes(MODES.output);
  }


  private updateAnalogOutputValues(newValues: AnalogState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.analog_output) {
        this.expander.state.setAnalogOutput(parseInt(pinNum), newValues[pinNum] || 0);
      }
    }
  }

  /**
   * Write all the values of analog output pins to IC.
   * It form data array where indexes are analog pin number and values are values of them.
   * Values of pins which din't set as analog will be 0.
   */
  async writeOutputStateToIc() {
    const dataToSend: Uint8Array = new Uint8Array(this.getLastPinNum() * BYTES_IN_WORD);

    // TODO: пройтись по количеству аналоговых пинов
    for (let pinNumString in this.expander.state.getAllAnalogOuputs()) {
      const pinNum: number = parseInt(pinNumString);

      // TODO: если режим не analog output - continue
      if (typeof this.expander.state.getAnalogOutput(pinNum) === 'undefined') continue;

      const valueWord: string = numToWord(Number(this.expander.state.getAnalogOutput(pinNum)));
      const int8ValueWord: Uint8Array = hexToBytes(valueWord);

      dataToSend[pinNum * BYTES_IN_WORD] = int8ValueWord[0];
      dataToSend[pinNum * BYTES_IN_WORD + 1] = int8ValueWord[1];
    }

    await this.expander.node.send(COMMANDS.setAllAnalogOutputValues, dataToSend);
  }

  private isAnalogPin(pin: number): boolean {
    const pinMode: number | undefined = this.pinModes[pin];

    return pinMode === MODES.analog_output || pinMode === MODES.analog_input;
  }

  private getLastPinNum(): number {
    return this.expander.props.analogPinsCount - 1;
  }

  private checkPin(pin: number) {
    if (typeof this.pinModes[pin] === 'undefined') {
      throw new Error(`PortExpanderDriver: analog pin "${pin}" hasn't been set up`);
    }
  }

}
