import {AnalogPinHandler, PortExpanderDriver} from './PortExpander.driver';
import {hexToBytes, numToWord} from '../../helpers/binaryHelpers';
import {BYTES_IN_WORD} from '../../app/dict/constants';
import IndexedEvents from '../../helpers/IndexedEvents';


export type AnalogState = (number | undefined)[];


export default class AnalogPins {
  private readonly expander: PortExpanderDriver;
  readonly events: IndexedEvents = new IndexedEvents();
  
  
  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }
  
  init() {
    
  }


  async setupAnalog(pin: number, pinMode: 'analog_input' | 'analog_output', outputInitialValue?: number): Promise<void> {
    if (this.wasIcInited) {
      // TODO: don't use system
      this.env.system.log.warn(`PortExpanderDriver.setupAnalog: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin > this.getLastAnalogPinNum()) {
      throw new Error('PortExpanderDriver.setupAnalog: Analog pin out of range');
    }

    // save value
    if (pinMode === 'analog_output' && typeof outputInitialValue !== 'undefined') {
      this.state.analogOutputs[pin] = outputInitialValue;
    }

    this.pinModes[pin] = MODES[pinMode];
  }

  addAnalogListener(handler: AnalogPinHandler): number {
    return this.events.addListener(handler);
  }

  async readAnalog(pin: number): Promise<number> {
    this.checkPin(pin);

    if (!this.isAnalogPin(pin)) {
      throw new Error(`PortExpanderDriver.readAnalog: pin "${pin}" hasn't been set up as an analog`);
    }

    if (this.pinModes[pin] === MODES.analog_output) {
      return this.state.analogOutputs[pin] || 0;
    }

    return this.state.analogInputs[pin] || 0;
  }

  async writeAnalog(pin: number, value: number): Promise<void> {
    if (!this.checkInitialization('writeAnalog')) return;

    this.checkPin(pin);
    await this.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.analog_output) {
      throw new Error(`PortExpanderDriver.writeAnalog: Can't write to not analog output pin "${pin}"`);
    }

    const dataToSend: Uint8Array = new Uint8Array(3);
    const valueWord: string = numToWord(value);
    const int8ValueWord: Uint8Array = hexToBytes(valueWord);

    dataToSend[0] = this.getHexPinNumber(pin);
    dataToSend[1] = int8ValueWord[0];
    dataToSend[2] = int8ValueWord[1];

    await this.expander.node.send(COMMANDS.setAnalogOutputValue, dataToSend);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeAnalogState(outputState: AnalogState): Promise<void> {
    if (!this.checkInitialization('writeAnalogState')) return;

    await this.initIcIfNeed();

    this.updateAnalogOutputValues(outputState);
    await this.writeOutputStateToIc();
  }


  private updateAnalogOutputValues(newValues: AnalogState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.analog_output) {
        this.state.analogOutputs[pinNum] = newValues[pinNum];
      }
    }
  }

  /**
   * Write all the values of analog output pins to IC.
   */
  async writeOutputStateToIc() {
    const dataToSend: Uint8Array = new Uint8Array(this.getLastAnalogPinNum() * BYTES_IN_WORD);

    for (let pinNumString in this.state.analogOutputs) {
      const pinNum: number = parseInt(pinNumString);

      if (typeof this.state.analogOutputs[pinNum] === 'undefined') continue;

      const valueWord: string = numToWord(Number(this.state.analogOutputs[pinNum]));
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

  private getLastAnalogPinNum(): number {
    return this.props.analogPinsCount - 1;
  }

}
