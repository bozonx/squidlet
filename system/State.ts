import System from './System';
import {JsonTypes} from './interfaces/Types';


export default class State {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  getState(stateName: string): JsonTypes {

  }

  updateState(stateName: string, newState: JsonTypes) {

  }

  onChange(stateName: string, cb: (state: JsonTypes) => void): number {

  }

}
