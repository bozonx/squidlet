import {IndexedEventEmitter} from 'squidlet-lib/src/IndexedEventEmitter.js'
import {LogPublisher} from 'squidlet-lib/src/LogPublisher.js'
import {SystemEvents} from '../types/contstants.js'
import {DriversManager} from './managers/DriversManager.js'
import {SystemInfoManager} from './managers/SystemInfoManager.js'
import {ServicesManager} from './managers/ServicesManager.js'
import {ApiManager} from './managers/ApiManager.js'
import {CmdManager} from './managers/CmdManager.js'
import {AppsManager} from './managers/AppsManager.js'
import {FilesManager} from './managers/FilesManager.js'
import {DbManager} from './managers/DbManager.js'
import {CacheManager} from './managers/CacheManager.js'
import {ConfigsManager} from './managers/ConfigsManager.js'
import {PermissionsManager} from './managers/PermissionsManager.js'
import {UiManager} from './managers/UiManager.js'
import {ExecManager} from './managers/ExecManager.js'
import {NetworkManager} from './managers/NetworkManager.js'


export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // managers
  readonly exec: ExecManager
  readonly systemInfo: SystemInfoManager
  readonly drivers: DriversManager
  readonly network: NetworkManager
  readonly files: FilesManager
  readonly db: DbManager
  readonly cache: CacheManager
  readonly configs: ConfigsManager
  readonly permissions: PermissionsManager
  readonly services: ServicesManager
  readonly apiManager: ApiManager
  readonly cmd: CmdManager
  readonly ui: UiManager
  readonly apps: AppsManager


  constructor() {
    this.exec = new ExecManager(this)
    this.systemInfo = new SystemInfoManager(this)
    this.drivers = new DriversManager(this)
    this.network = new NetworkManager(this)
    this.files = new FilesManager(this)
    this.db = new DbManager(this)
    this.cache = new CacheManager(this)
    this.configs = new ConfigsManager(this)
    this.permissions = new PermissionsManager(this)
    this.services = new ServicesManager(this)
    this.apiManager = new ApiManager(this)
    this.cmd = new CmdManager(this)
    this.ui = new UiManager(this)
    this.apps = new AppsManager(this)
  }


  async init() {
    await this.exec.init()
    await this.systemInfo.init()
    await this.drivers.init()
    await this.network.init()
    await this.files.init()
    await this.db.init()
    await this.cache.init()
    await this.configs.init()
    await this.permissions.init()
    await this.services.init()
    await this.apiManager.init()
    await this.cmd.init()
    await this.ui.init()
    await this.apps.init()
  }

  async destroy() {
    // TODO: продолжить дестроить даже если будет ошибка
    await this.apps.destroy()
    await this.ui.destroy()
    await this.cmd.destroy()
    await this.apiManager.destroy()
    await this.services.destroy()
    await this.permissions.destroy()
    await this.configs.destroy()
    await this.cache.destroy()
    await this.db.destroy()
    await this.files.destroy()
    await this.network.destroy()
    await this.drivers.destroy()
    await this.systemInfo.destroy()
    await this.exec.destroy()
  }


  async start() {

  }

}
