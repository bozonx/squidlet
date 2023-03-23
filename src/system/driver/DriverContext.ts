import {System} from '../System.js'
import {Logger} from 'squidlet-lib'


export class DriverContext {
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

}
