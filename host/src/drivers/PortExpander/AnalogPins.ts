import {COMMANDS, MODES, PortExpanderDriver} from './PortExpander.driver';
import {hexToBytes, numToWord} from '../../helpers/binaryHelpers';
import {BYTES_IN_WORD} from '../../app/dict/constants';
import IndexedEvents from '../../helpers/IndexedEvents';
import {AnalogState} from './State';


export type AnalogPinHandler = (targetPin: number, value: number) => void;


export default class AnalogPins {
  private readonly expander: PortExpanderDriver;
  readonly events: IndexedEvents = new IndexedEvents();
  
  
  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }


  async setupAnalog(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    if (this.expander.wasIcInited) {
      // TODO: don't use system
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

    this.expander.pinModes[pin] = MODES[pinMode];
  }

  addAnalogListener(handler: AnalogPinHandler): number {
    return this.events.addListener(handler);
  }

  async readAnalog(pin: number): Promise<number> {
    this.expander.checkPin(pin);

    if (!this.isAnalogPin(pin)) {
      throw new Error(`PortExpanderDriver.readAnalog: pin "${pin}" hasn't been set up as an analog`);
    }

    if (this.expander.pinModes[pin] === MODES.analog_output) {
      return this.expander.state.getAnalogOutput(pin) || 0;
    }

    return this.expander.state.getAnalogInput(pin) || 0;
  }

  async writeAnalog(pin: number, value: number): Promise<void> {
    if (!this.expander.checkInitialization('writeAnalog')) return;

    this.expander.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.expander.pinModes[pin] !== MODES.analog_output) {
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


  private updateAnalogOutputValues(newValues: AnalogState) {
    for (let pinNum in newValues) {
      if (this.expander.pinModes[pinNum] === MODES.analog_output) {
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
    const pinMode: number | undefined = this.expander.pinModes[pin];

    return pinMode === MODES.analog_output || pinMode === MODES.analog_input;
  }

  private getLastPinNum(): number {
    return this.expander.props.analogPinsCount - 1;
  }

}
