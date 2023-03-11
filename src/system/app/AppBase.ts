import {System} from '../System.js'
import {AppContext} from './AppContext.js'

export class ServiceBase {
  private readonly system: System
  private readonly context: AppContext


  constructor(system: System) {
    this.system = system
    this.context = new AppContext(this.system)
  }


  async init() {

  }

  async destroy() {
    await this.context.destroy()
  }
}
