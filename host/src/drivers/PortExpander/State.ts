import {cloneDeep} from '../../helpers/lodashLike';
import {callOnDifferentValues} from '../../helpers/helpers';
import {convertBytesToBits} from '../../helpers/binaryHelpers';


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
  private readonly state: ExpanderState = {
    inputs: [],
    outputs: [],
    analogInputs: [],
    analogOutputs: [],
  };

  constructor() {

  }

  getAllDigitalOutputs(): DigitalState {
    return this.state.outputs;
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

  getAnalogOutput(pin: number): number | undefined {
    return this.state.analogOutputs[pin];
  }

  getAnalogInput(pin: number): number | undefined {
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

  /**
   * On change received data after poling on node driver.
   * Find changed pins and rise events on them.
   */
  handleStateEvent(data: Uint8Array) {

    // TODO: может 1й байт будет коммандой???
    // TODO: помдее должен прийти весь стейт сразу

    const lastState: State = cloneDeep(this.state);

    this.setLastReceivedState(data);

    callOnDifferentValues(this.state.inputs, lastState.inputs, (pinNum: number, newValue: boolean) => {
      this.digitalPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.outputs, lastState.outputs, (pinNum: number, newValue: boolean) => {
      this.digitalPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.analogInputs, lastState.analogInputs, (pinNum: number, newValue: number) => {
      this.analogPins.events.emit(pinNum, newValue);
    });
    callOnDifferentValues(this.state.analogOutputs, lastState.analogOutputs, (pinNum: number, newValue: number) => {
      this.analogPins.events.emit(pinNum, newValue);
    });
  }

  private setLastReceivedState(data: Uint8Array) {

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

}
