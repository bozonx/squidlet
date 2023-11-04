import type {System} from '../System.js'


export class SystemInfoManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {
  }

  async destroy() {
  }
}
