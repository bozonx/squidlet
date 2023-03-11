import {System} from '../System.js'
import {AppContext} from '../app/AppContext.js'


export class AppsManager {
  private readonly system: System
  private readonly context: AppContext


  constructor(system: System) {
    this.system = system
    this.context = new AppContext(this.system)
  }

  async init() {
  }

  async destroy() {
  }
}
