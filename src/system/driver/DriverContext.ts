import {System} from '../System.js'


export class DriverContext {
  private readonly system: System
  private readonly context: DriverContext


  constructor(system: System) {
    this.system = system
    this.context = new DriverContext(this.system)
  }

  async init() {

  }

  async destroy() {
  }
}
