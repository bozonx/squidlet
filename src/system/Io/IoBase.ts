import {System} from '../System.js'
import {IoContext} from './IoContext.js'


export abstract class IoBase {
  readonly abstract name: string
  private readonly system: System
  private readonly context: IoContext


  constructor(system: System) {
    this.system = system
    this.context = new IoContext(this.system)
  }

  async init() {
  }

  async destroy() {
    await this.context.destroy()
  }
}
