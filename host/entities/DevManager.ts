import Dev from '../interfaces/Dev';


export type DevClass = new () => Dev;


export default class DevManager {
  //private readonly system: System;
  private devSet: {[index: string]: Dev} = {};


  constructor(devSet: {[index: string]: DevClass}) {
    for (let devNme of Object.keys(devSet)) {
      this.devSet[devNme] = new devSet[devNme]();
    }
  }

  init() {
    for (let devNme of Object.keys(this.devSet)) {
      const dev: Dev = this.devSet[devNme];

      if (dev.init) dev.init();
    }
  }


  getDev<T extends Dev>(devName: string): T {
    if (!this.devSet[devName]) {
      throw new Error(`Can't find dev "${devName}"`);
    }

    return this.devSet[devName] as T;
  }

}
