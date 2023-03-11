import {IndexedEventEmitter} from 'squidlet-lib/src/IndexedEventEmitter.js'
import {LogLevel} from 'squidlet-lib/src/interfaces/Logger.js'
import {LogPublisher} from 'squidlet-lib/src/LogPublisher.js'
import {DriversManager} from './managers/DriversManager.js'
import {SystemInfoManager} from './managers/SystemInfoManager.js'
import {ServicesManager} from './managers/ServicesManager.js'
import {ApiManager} from './managers/ApiManager.js'
import {CmdManager} from './managers/CmdManager.js'


export class System {
  readonly log: LogPublisher
  readonly events = new IndexedEventEmitter()
  readonly drivers: DriversManager
  readonly services: ServicesManager
  readonly systemInfo: SystemInfoManager
  readonly apiManager: ApiManager
  readonly cmd: CmdManager


  constructor() {
    this.log = new LogPublisher((logLevel: LogLevel, msg: string) => {
      this.events.emit('', logLevel, msg)
    })
    this.drivers = new DriversManager()
    this.services = new ServicesManager()
    this.systemInfo = new SystemInfoManager()
    this.apiManager = new ApiManager()
    this.cmd = new CmdManager()
  }


  async init() {
    await this.drivers.init()
    await this.services.init()
    await this.systemInfo.init()
    await this.apiManager.init()
    await this.cmd.init()
  }

  async destroy() {
    // TODO: продолжить дестроить даже если будет ошибка
    await this.cmd.destroy()
    await this.apiManager.destroy()
    await this.systemInfo.destroy()
    await this.services.destroy()
    await this.drivers.destroy()
  }


  async start() {

  }

}
