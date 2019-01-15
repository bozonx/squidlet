import {callOnDifferentValues, updateArray} from '../../helpers/helpers';
import {convertBytesToBits} from '../../helpers/binaryHelpers';
import IndexedEvents from '../../helpers/IndexedEvents';
import {DigitalPinHandler} from './DigitalPins';
import {AnalogPinHandler} from './AnalogPins';
import {PortExpanderDriver} from './PortExpander.driver';


export type DigitalState = (boolean | undefined)[];
export type AnalogState = (number | undefined)[];

export interface ExpanderState {
  // array like [true, undefined, false, ...]. Indexes are pin numbers, undefined is for not input pins
  inputs: DigitalState;
  outputs: DigitalState;
  // indexes are analog pin numbers from 0
  analogInputs: AnalogState;
  analogOutputs: AnalogState;
}


export default class State {
  readonly digitalEvents = new IndexedEvents<DigitalPinHandler>();
  readonly analogEvents = new IndexedEvents<AnalogPinHandler>();
  private readonly expander: PortExpanderDriver;
  private readonly state: ExpanderState = {
    inputs: [],
    outputs: [],
    analogInputs: [],
    analogOutputs: [],
  };


  constructor(expander: PortExpanderDriver) {
    this.expander = expander;
  }


  getAllState(): ExpanderState {
    return this.state;
  }

  getDigitalOutput(pin: number): boolean | undefined {
    return this.state.outputs[pin];
  }

  getDigitalInput(pin: number): boolean | undefined {
    return this.state.inputs[pin];
  }

  getAnalogOutput(pin: number): number {
    return this.state.analogOutputs[pin] || 0;
  }

  getAnalogInput(pin: number): number {
    return this.state.analogInputs[pin] || 0;
  }

  setDigitalOutput(pin: number, value: boolean) {
    this.state.outputs[pin] = value;
  }

  setAnalogOutput(pin: number, value: number) {
    this.state.analogOutputs[pin] = value;
  }

  updateDigitalState(data: Uint8Array) {
    const oldInputsState: DigitalState = this.state.inputs;
    const oldOutputsState: DigitalState = this.state.outputs;
    const newInputsState: DigitalState = [];
    const newOutputsState: DigitalState = [];
    const bitsState: DigitalState = convertBytesToBits(data);

    for (let pinNum in bitsState) {
      // filter only inputs
      if (this.expander.digitalPins.isInputPin(parseInt(pinNum))) {
        newInputsState[pinNum] = bitsState[pinNum];
      }
      else {
        newOutputsState[pinNum] = bitsState[pinNum];
      }
    }

    this.state.inputs = newInputsState;
    this.state.outputs = newOutputsState;

    callOnDifferentValues(this.state.inputs, oldInputsState, (pinNum: number, newValue: boolean) => {
      this.digitalEvents.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.outputs, oldOutputsState, (pinNum: number, newValue: boolean) => {
      this.digitalEvents.emit(pinNum, newValue);
    });
  }

  updateAnalogState(data: Uint8Array) {
    // save old arrays. It doesn't need to clone them because they will be reassigned
    const lastInputState: AnalogState = this.state.analogInputs;
    const lastOutputState: AnalogState = this.state.analogOutputs;

    // TODO: set new state
    const newState: AnalogState = this.parseAnalogReceivedState(data);

    callOnDifferentValues(this.state.analogInputs, lastInputState, (pinNum: number, newValue: number) => {
      this.analogEvents.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.analogOutputs, lastOutputState, (pinNum: number, newValue: number) => {
      this.analogEvents.emit(pinNum, newValue);
    });
  }


  private parseDigitalReceivedState(data: Uint8Array): DigitalState {

    // TODO: помдее должен прийти весь стейт сразу

    // TODO: review
    // TODO: what about analog ?
    // TODO: outputs тоже обновлять на всякий случай

    const newState: DigitalState = convertBytesToBits(data);

    console.log(11111111, 'current - ', this.state.inputs, ' | new - ', data, ' | parsed - ', newState);

    // update values
    for (let pinNum in newState) {
      // TODO: почему только digital ???
      // filter only inputs
      if (!this.digitalPins.isInputPin(parseInt(pinNum))) return;

      this.state.inputs[pinNum] = newState[pinNum];
    }
  }

  private parseAnalogReceivedState(data: Uint8Array): AnalogState {
    // TODO: !!!!!!
  }

}
