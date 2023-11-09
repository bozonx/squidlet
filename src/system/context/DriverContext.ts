import type {Logger} from 'squidlet-lib'
import type {System} from '../System.js'
import type {IoManager} from '../managers/IoManager.js'


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
