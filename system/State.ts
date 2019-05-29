import System from './System';
import {JsonTypes} from './interfaces/Types';


// TODO: add republish


export default class State {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  destroy() {
    // TODO: add
  }


  getState(stateName: string): JsonTypes {
    // TODO: add
    return 0;
  }

  updateState(stateName: string, newState: JsonTypes) {
    // TODO: add

  }

  onChange(stateName: string, cb: (state: JsonTypes, isRepublish?: true) => void): number {
    // TODO: add
    return 0;
  }

}
