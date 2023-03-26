import {bytesToBits} from 'lib/binaryHelpers';
import IndexedEvents from 'lib/IndexedEvents';

import {DigitalPinHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/DigitalPins.js';
import {AnalogPinHandler} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/AnalogPins.js';
import {PortExpander} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/PortExpander.js';


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



// TODO: review
// TODO: test
export function callOnDifferentValues(
  arr1: any[],
  arr2: any[],
  cb: (index: number, value1: any, value2: any) => void
) {
  for (let indexStr in arr1) {
    const index: number = parseInt(indexStr);

    if (arr1[index] !== arr2[index]) {
      cb(index, arr1[index], arr2[index]);
    }
  }
}



export default class State {
  readonly digitalEvents = new IndexedEvents<DigitalPinHandler>();
  readonly analogEvents = new IndexedEvents<AnalogPinHandler>();
  private readonly expander: PortExpander;
  private readonly state: ExpanderState = {
    inputs: [],
    outputs: [],
    analogInputs: [],
    analogOutputs: [],
  };


  constructor(expander: PortExpander) {
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

  setAnalogInput(pin: number, value: number) {
    this.state.analogInputs[pin] = value;
  }

  /**
   * Set all the digital state.
   * 1st byte - pin numbers from 0 to 7 and values of them
   * 2nd byte - pin numbers from 8 and more
   */
  updateDigitalState(data: Uint8Array) {
    const oldInputsState: DigitalState = this.state.inputs;
    const oldOutputsState: DigitalState = this.state.outputs;
    const newInputsState: DigitalState = [];
    const newOutputsState: DigitalState = [];
    const bitsState: DigitalState = bytesToBits(data);

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

}
