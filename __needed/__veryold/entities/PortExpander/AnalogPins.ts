import {numToUint8Word} from 'lib/binaryHelpers';
import {BYTES_IN_WORD} from 'lib/constants';
import {getKeyOfObject} from 'lib/objects';

import {
  COMMANDS,
  MODES, NO_MODE,
  PortExpanderAnalogPinMode,
  PortExpander,
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/PortExpander.js';
import {AnalogState} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/State.js';


export type FilterTypes = 'lowPass' | 'median';

export type AnalogPinHandler = (targetPin: number, value: number) => void;


export default class AnalogPins {
  // pin modes which are set at init time.
  private pinModes: number[] = [];
  private readonly expander: PortExpander;


  constructor(expander: PortExpander) {
    this.expander = expander;
  }


  getPinMode(pin: number): PortExpanderAnalogPinMode | undefined {
    const pinModeByte: number = this.pinModes[pin];

    return getKeyOfObject(MODES, pinModeByte) as PortExpanderAnalogPinMode | undefined;
  }

  async setupInput(pin: number, filterType?: FilterTypes, filterThreshold?: number): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupAnalog: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin >= this.expander.props.analogPinsCount) {
      throw new Error('PortExpanderDriver.setupAnalog: Analog pin out of range');
    }

    // TODO: save filter type and filter treshold

    this.pinModes[pin] = MODES.analog_input;
  }

  async setupOutput(pin: number, outputInitialValue?: number): Promise<void> {
    if (this.expander.wasIcInited) {
      this.expander.log.warn(`PortExpanderDriver.setupAnalog: can't setup pin "${pin}" because IC was already initialized`);

      return;
    }

    if (pin < 0 || pin >= this.expander.props.analogPinsCount) {
      throw new Error('PortExpanderDriver.setupAnalog: Analog pin out of range');
    }

    // save value
    this.expander.state.setAnalogOutput(pin, outputInitialValue || 0);

    this.pinModes[pin] = MODES.analog_output;
  }

  /**
   * Write all the pin modes to IC.
   */
  async writePinModes() {
    const pinCount = this.expander.props.analogPinsCount;
    const dataToSend: Uint8Array = new Uint8Array(pinCount);

    for (let i = 0; i < pinCount; i++) {
      if (typeof this.pinModes[i] === 'undefined') {
        dataToSend[i] = NO_MODE;
      }
      else {
        dataToSend[i] = this.pinModes[i];
      }
    }

    await this.expander.node.send(COMMANDS.setupAllAnalog, dataToSend);
  }

  async read(pin: number): Promise<number> {
    this.checkPin(pin);

    if (!this.isAnalogPin(pin)) {
      throw new Error(`PortExpanderDriver.readAnalog: pin "${pin}" hasn't been set up as an analog`);
    }

    if (this.pinModes[pin] === MODES.analog_output) {
      return this.expander.state.getAnalogOutput(pin);
    }

    return this.expander.state.getAnalogInput(pin);
  }

  async write(pin: number, value: number): Promise<void> {
    if (!this.expander.checkInitialization('writeAnalog')) return;

    this.checkPin(pin);
    await this.expander.initIcIfNeed();

    if (this.pinModes[pin] !== MODES.analog_output) {
      throw new Error(`PortExpanderDriver.writeAnalog: Can't write to not analog output pin "${pin}"`);
    }

    const dataToSend: Uint8Array = new Uint8Array(3);
    const uint8Word = numToUint8Word(value);

    dataToSend[0] = this.expander.getHexPinNumber(pin);
    dataToSend[1] = uint8Word[0];
    dataToSend[2] = uint8Word[1];

    await this.expander.node.send(COMMANDS.setAnalogOutputValue, dataToSend);
  }

  /**
   * Write all the values of analog output pins.
   */
  async writeState(outputState: AnalogState): Promise<void> {
    if (!this.expander.checkInitialization('writeState')) {
      return;
    }
    else if (!this.hasOutputPins()) {
      this.expander.log.warn(`Trying to write analog state to expander but there isn't configured any analod output pins`);

      return;
    }

    await this.expander.initIcIfNeed();

    this.updateOutputValues(outputState);
    await this.writeOutputStateToIc();
  }

  /**
   * Write all the values of analog output pins to IC.
   * It form data array where indexes are analog pin number and values are values of them.
   * Values of pins which din't set as analog will be 0.
   */
  async writeOutputStateToIc() {
    const dataToSend: Uint8Array = new Uint8Array(this.getLastPinNum() * BYTES_IN_WORD);

    for (let pinNum = 0; pinNum <= this.expander.props.analogPinsCount; pinNum++) {
      // skip is it isn't an output pin
      if (this.pinModes[pinNum] !== MODES.analog_output) continue;

      const uint8Word = numToUint8Word(this.expander.state.getAnalogOutput(pinNum));

      dataToSend[pinNum * BYTES_IN_WORD] = uint8Word[0];
      dataToSend[pinNum * BYTES_IN_WORD + 1] = uint8Word[1];
    }

    await this.expander.node.send(COMMANDS.setAllAnalogOutputValues, dataToSend);
  }

  hasOutputPins(): boolean {
    return this.pinModes.includes(MODES.output);
  }


  private updateOutputValues(newValues: AnalogState) {
    for (let pinNum in newValues) {
      if (this.pinModes[pinNum] === MODES.analog_output) {
        this.expander.state.setAnalogOutput(parseInt(pinNum), newValues[pinNum] || 0);
      }
    }
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
