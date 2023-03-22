import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {System} from '../System.js'
import {DriverIndex, IoIndex, ServiceIndex} from '../../types/types.js'


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


  useIo(io: IoIndex) {
    this.system.io.useIo(io)
  }

  useDriver(driver: DriverIndex) {
    this.system.drivers.useDriver(driver)
  }

  useService(service: ServiceIndex) {
    this.system.services.useService(service)
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
