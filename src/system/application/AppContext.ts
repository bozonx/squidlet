import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {System} from '../System.js'
import {DriversManager} from '../driver/DriversManager.js'


/**
 * Restricted access to system functions for apps
 */
export class AppContext {
  private readonly system: System


  get log(): Logger {
    return this.system.log
  }

  get drivers(): DriversManager {
    return this.system.drivers
  }

  get events(): IndexedEventEmitter {
    return this.system.events
  }


  constructor(system: System) {
    this.system = system
  }

}
