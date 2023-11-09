import type {Logger} from 'squidlet-lib'
import type {System} from '../System.js'


export class IoContext {
  private readonly system: System

  get log(): Logger {
    return this.system.log
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {

  }

  async destroy() {
  }


  async loadIoConfig(ioName: string): Promise<Record<string, any> | undefined> {
    return this.system.configs.loadIoConfig(ioName)
  }

}
