import {System} from '../System.js'
import {Logger} from 'squidlet-lib'
import {IoManager} from '../Io/IoManager.js'


export class DriverContext {
  private readonly system: System


  get log(): Logger {
    return this.system.log
  }

  get io(): IoManager {
    return this.system.io
  }


  constructor(system: System) {
    this.system = system
  }

}
