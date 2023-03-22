import {ServiceContext} from './ServiceContext.js'
import {System} from '../System.js'


export class ServiceBase {
  private readonly system: System
  private readonly context: ServiceContext


  constructor(system: System) {
    this.system = system
    this.context = new ServiceContext(this.system)
  }

  async init() {
  }

  async destroy() {
    await this.context.destroy()
  }
}