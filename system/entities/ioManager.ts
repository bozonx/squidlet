import IoItem from '../interfaces/IoItem';
import System from '../System';
import IoItemDefinition from '../interfaces/IoItemDefinition';
import IoSet from '../interfaces/IoSet';


export default class IoManager {
  private readonly system: System;
  private readonly ioSet: IoSet;


  constructor(system: System, ioSet: IoSet) {
    this.system = system;
    this.ioSet = ioSet;
  }

  async init() {
    await this.ioSet.init(this.system);
  }


  getDev<T extends IoItem>(ioName: string): T {
    // if (!this.devSet[devName]) {
    //   throw new Error(`Can't find dev "${devName}"`);
    // }
    //
    // return this.devSet[devName] as T;

    return this.ioSet.getInstance<T>(ioName);
  }

}
