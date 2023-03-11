import {System} from '../System.js'


/**
 * Run external code in sandbox
 */
export class ExecManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }


  async init() {
  }

  async destroy() {
  }
}
