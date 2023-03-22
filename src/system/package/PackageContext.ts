import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {System} from '../System.js'


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


  registerIo() {
    // TODO: add
  }

  registerDriver() {
    // TODO: add
  }

  registerService() {
    // TODO: add
  }

  registerCmd() {
    // TODO: add
  }

  registerApi() {
    // TODO: add
  }

  registerUiApp() {
    // TODO: add
  }

  registerDestroyFunc() {
    // TODO: add
  }

}
