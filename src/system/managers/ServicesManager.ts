import {System} from '../System.js'
import {ServiceContext} from '../service/ServiceContext.js'


export class ServicesManager {
  private readonly system: System
  private readonly context: ServiceContext


  constructor(system: System) {
    this.system = system
    this.context = new ServiceContext(this.system)
  }

  async init() {
  }

  async destroy() {
  }


  async start() {
  }
}
