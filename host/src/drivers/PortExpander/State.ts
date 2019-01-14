import {callOnDifferentValues} from '../../helpers/helpers';
import {convertBytesToBits} from '../../helpers/binaryHelpers';
import IndexedEvents from '../../helpers/IndexedEvents';


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
  readonly digitalEvents: IndexedEvents = new IndexedEvents();
  readonly analogEvents: IndexedEvents = new IndexedEvents();

  private readonly state: ExpanderState = {
    inputs: [],
    outputs: [],
    // TODO: можно сделать uint8Arr
    analogInputs: [],
    analogOutputs: [],
  };


  constructor() {
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

  // TODO: remove
  getAllAnalogOuputs(): AnalogState {
    return this.state.analogOutputs;
  }

  getAnalogOutput(pin: number): number {
    return this.state.analogOutputs[pin];
  }

  getAnalogInput(pin: number): number {
    return this.state.analogInputs[pin];
  }

  // setDigitalInput(pin: number, value: boolean) {
  //   this.state.inputs[pin] = value;
  // }

  setDigitalOutput(pin: number, value: boolean) {
    this.state.outputs[pin] = value;
  }

  // setAnalogInput(pin: number, value: number) {
  //
  // }

  setAnalogOutput(pin: number, value: number) {
    this.state.analogOutputs[pin] = value;
  }

  updateDigitalState(data: Uint8Array) {
    // save old arrays. It doesn't need to clone them because they will be reassigned
    const lastInputState: DigitalState = this.state.inputs;
    const lastOutputState: DigitalState = this.state.outputs;

    // TODO: set new state
    const newState: DigitalState = this.parseDigitalReceivedState(data);

    callOnDifferentValues(this.state.inputs, lastInputState, (pinNum: number, newValue: boolean) => {
      this.digitalEvents.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.outputs, lastOutputState, (pinNum: number, newValue: boolean) => {
      this.digitalEvents.emit(pinNum, newValue);
    });
  }

  // TODO: впринципе можно принимать не все сразу а по 1 пину
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

  }

}
