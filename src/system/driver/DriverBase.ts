import {DriverContext} from './DriverContext.js'
import {System} from '../System.js'


export abstract class DriverBase {
  // dirver name
  readonly abstract name: string

  private readonly system: System
  private readonly context: DriverContext


  constructor(system: System) {
    this.system = system
    this.context = new DriverContext(this.system)
  }

  async init() {
  }

  async destroy() {
    await this.context.destroy()
  }
}
