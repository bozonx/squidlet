import IoItem from '../system/interfaces/IoItem';
import System from '../system/System';
import IoSet from '../system/interfaces/IoSet';


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
    return this.ioSet.getInstance<T>(ioName);
  }

}
