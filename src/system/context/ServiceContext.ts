import type {IndexedEventEmitter, Logger} from 'squidlet-lib'
import type {System} from '../System.js'
import type {DriversManager} from '../managers/DriversManager.js'
import type {AppManager} from '../managers/AppManager.js'


export class ServiceContext {
  private readonly system: System

  get log(): Logger {
    return this.system.log
  }

  get drivers(): DriversManager {
    return this.system.drivers
  }

  get apps(): AppManager {
    return this.system.apps
  }

  get events(): IndexedEventEmitter {
    return this.system.events
  }

  getServiceApi<T = Record<string, any>>(serviceName: string): T | undefined {
    return this.system.services.getServiceApi<T>(serviceName)
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
