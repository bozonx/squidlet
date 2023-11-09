import type {IndexedEventEmitter, Logger} from 'squidlet-lib'
import type {System} from '../System.js'
import type {AppIndex, DriverIndex, ServiceIndex} from '../../types/types.js'
import type {IoSetBase} from '../../base/IoSetBase.js'


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


  useIoSet(ioSet: IoSetBase) {
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
