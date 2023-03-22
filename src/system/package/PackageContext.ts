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

  // TODO: add system config
  // TODO: add using permissions - exec, cmd, fs etc
  // TODO: add платформо-зависимые переменные окружения


  constructor(system: System) {
    this.system = system
  }


  registerIo() {

  }

  registerDriver() {

  }

  registerService() {

  }

  registerUiApp() {

  }

  registerCmd() {

  }

  registerApi() {

  }

}
