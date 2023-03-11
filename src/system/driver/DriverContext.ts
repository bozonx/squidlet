import {System} from '../System.js'


export class DriverContext {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }


  async destroy() {
  }
}
