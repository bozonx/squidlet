import {IndexedEventEmitter} from 'squidlet-lib'
import {LogPublisher} from 'squidlet-lib'
import {SystemEvents} from '../types/contstants.js'
import {IoManager} from './managers/IoManager.js'
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
import {IoSetBase} from '../types/IoSet.js'


export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // managers
  readonly io: IoManager
  // DRIVERS
  readonly exec: ExecManager
  readonly systemInfo: SystemInfoManager
  // TODO: add timer driver wrapper
  // TODO: add system time driver wrapper
  // SYSTEM
  readonly permissions: PermissionsManager
  // SERVICES
  readonly services: ServicesManager
  readonly files: FilesManager
  readonly cache: CacheManager
  readonly db: DbManager
  // It is wrapper for DB which is works with configs
  readonly configs: ConfigsManager
  readonly network: NetworkManager
  // it is service
  readonly ui: UiManager
  readonly apiManager: ApiManager
  // it is wrapper for api
  readonly cmd: CmdManager

  readonly apps: AppsManager
  // TODO: распределённая служба заданний
  // TODO: realtime api


  constructor(ioSet: IoSetBase) {
    this.io = new IoManager(this, ioSet)
    this.exec = new ExecManager(this)
    this.systemInfo = new SystemInfoManager(this)
    this.files = new FilesManager(this)
    this.cache = new CacheManager(this)
    this.db = new DbManager(this)
    this.configs = new ConfigsManager(this)
    this.permissions = new PermissionsManager(this)
    this.services = new ServicesManager(this)
    this.network = new NetworkManager(this)
    this.apiManager = new ApiManager(this)
    this.cmd = new CmdManager(this)
    this.ui = new UiManager(this)
    this.apps = new AppsManager(this)
  }


  async init() {
    await this.io.init()
    await this.exec.init()
    await this.systemInfo.init()
    await this.files.init()
    await this.cache.init()
    await this.db.init()
    await this.configs.init()
    await this.permissions.init()
    await this.services.init()
    await this.network.init()
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
    await this.network.destroy()
    await this.services.destroy()
    await this.permissions.destroy()
    await this.configs.destroy()
    await this.db.destroy()
    await this.cache.destroy()
    await this.files.destroy()
    await this.systemInfo.destroy()
    await this.exec.destroy()
    await this.io.destroy()
  }


  async start() {
    // start system's and user's services
    await this.services.start()
    // TODO: выполнение пользовательских startup скриптов, где могут быть указанны apps
  }

}
