import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {System} from '../System.js'
import {AppIndex, DriverIndex, IoIndex, ServiceIndex} from '../../types/types.js'


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


  useIoSet(ioSet: IoIndex) {
    this.system.io.useIoSet(ioSet)
  }

  useDriver(driverIndex: DriverIndex) {
    this.system.drivers.useDriver(driverIndex)
  }

  useService(serviceIndex: ServiceIndex) {
    this.system.services.useService(serviceIndex)
  }

  useApp(appIndex: AppIndex) {
    this.system.apps.useApp(appIndex)
  }

  // useApi() {
  //   // TODO: add
  // }
  //
  // useUiApp() {
  //   // TODO: add
  // }
  //
  // useDestroyFunc() {
  //   // TODO: add
  // }

}
