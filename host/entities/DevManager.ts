import System from '../System';
import Dev from '../interfaces/Dev';


export type DevClass = new () => Dev;


export default class DevManager {
  //private readonly system: System;
  private devSet: {[index: string]: Dev} = {};


  // constructor(system: System) {
  //   this.system = system;
  // }


  init() {
    for (let devNme of Object.keys(this.devSet)) {
      const dev: Dev = this.devSet[devNme];

      if (dev.init) dev.init();
    }
  }

  registerDevSet(devSet: {[index: string]: DevClass}) {
    for (let devNme of Object.keys(devSet)) {

      // TODO: make definition ???
      //const definition: {id: driverName, className: driverName, props: {}};

      this.devSet[devNme] = new devSet[devNme]();
    }
  }

  getDev<T extends Dev>(devName: string): T {
    if (!this.devSet[devName]) {
      throw new Error(`Can't find dev "${devName}"`);
    }

    return this.devSet[devName] as T;
  }

}
