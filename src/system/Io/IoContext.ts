import {System} from '../System.js'


export class IoContext {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {

  }

  async destroy() {
  }
}
