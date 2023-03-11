import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import LogPublisher from 'squidlet-lib/src/LogPublisher'
import {DriversManager} from './managers/DriversManager'
import {SystemInfoManager} from './managers/SystemInfoManager'
import {ServicesManager} from './managers/ServicesManager'
import {ApiManager} from './managers/ApiManager'


export class System {
  readonly log: LogPublisher
  readonly events = new IndexedEventEmitter()
  readonly drivers: DriversManager
  readonly services: ServicesManager
  readonly systemInfo: SystemInfoManager
  readonly apiManager: ApiManager


  constructor() {
    this.log = new LogPublisher((logLevel, msg: string) => {
      this.events.emit('', logLevel, msg)
    })
    this.drivers = new DriversManager()
    this.services = new ServicesManager()
    this.systemInfo = new SystemInfoManager()
    this.apiManager = new ApiManager()
  }


  async init() {
    await this.drivers.init()
    await this.services.init()
    await this.systemInfo.init()
    await this.apiManager.init()
  }

  async destroy() {
    // TODO: продолжить дестроить даже если будет ошибка
    await this.apiManager.destroy()
    await this.systemInfo.destroy()
    await this.services.destroy()
    await this.drivers.destroy()
  }


  async start() {

  }

}
