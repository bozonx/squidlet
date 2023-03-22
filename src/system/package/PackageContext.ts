import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {System} from '../System.js'
import {DriverIndex} from '../../types/types.js'


export class PackageContext {
  private readonly system


  get events(): IndexedEventEmitter {
    return this.system.events
  }

  get log(): Logger {
    return this.system.log
  }


  constructor(system: System) {
    this.system = system
  }


  useIo() {
    // TODO: add
  }

  useDriver(driver: DriverIndex) {
    this.system.drivers.useDriver(driver)
  }

  useService() {
    // TODO: add
  }

  useCmd() {
    // TODO: add
  }

  useApi() {
    // TODO: add
  }

  useUiApp() {
    // TODO: add
  }

  useDestroyFunc() {
    // TODO: add
  }

}
