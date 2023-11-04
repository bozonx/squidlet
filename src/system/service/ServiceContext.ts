import type {IndexedEventEmitter, Logger} from 'squidlet-lib'
import type {System} from '../System.js'
import type {DriversManager} from '../driver/DriversManager.js'


export class ServiceContext {
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

  // async init() {
  // }
  //
  // async destroy() {
  // }

  getAppUiStaticFiles(appName: string): string[] | undefined {
    return this.system.appsUi.getUi(appName)
  }

}
