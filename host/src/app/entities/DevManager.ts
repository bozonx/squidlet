import System from '../System';
import {EntityClassType} from './EntityManagerBase';
import Dev from '../interfaces/Dev';


export default class DevManager {
  private readonly system: System;
  private devSet: {[index: string]: Dev} = {};


  constructor(system: System) {
    this.system = system;
  }


  init() {
    for (let devNme of Object.keys(this.devSet)) {
      const dev: Dev = this.devSet[devNme];

      if (dev.init) dev.init();
    }
  }

  registerDevsSet(devSet: {[index: string]: EntityClassType}) {
    for (let devNme of Object.keys(devSet)) {

    }
    // TODO: instantiate

    this.devSet = devSet;
  }

  getDev<T extends Dev>(devName: string): T {
    if (!this.devSet[devName]) {
      throw new Error(`Can't find dev "${devName}"`);
    }

    return this.devSet[devName] as T;
  }

}
