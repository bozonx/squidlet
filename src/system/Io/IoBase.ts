import {System} from '../System.js'
import {IoContext} from './IoContext.js'


export class IoBase {
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
