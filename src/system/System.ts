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


export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // managers
  readonly io: IoManager
  // TODO: по сути это драйвер
  readonly exec: ExecManager
  // TODO: по сути это драйвер
  readonly systemInfo: SystemInfoManager
  readonly files: FilesManager
  readonly cache: CacheManager
  readonly db: DbManager
  readonly configs: ConfigsManager
  readonly permissions: PermissionsManager
  readonly network: NetworkManager
  readonly services: ServicesManager
  readonly apiManager: ApiManager
  readonly cmd: CmdManager
  readonly ui: UiManager
  readonly apps: AppsManager
  // TODO: распределённая служба заданний
  // TODO: realtime api


  constructor() {
    this.io = new IoManager(this)
    this.exec = new ExecManager(this)
    this.systemInfo = new SystemInfoManager(this)
    this.files = new FilesManager(this)
    this.cache = new CacheManager(this)
    this.db = new DbManager(this)
    this.configs = new ConfigsManager(this)
    this.permissions = new PermissionsManager(this)
    this.network = new NetworkManager(this)
    this.services = new ServicesManager(this)
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
    await this.network.init()
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
    await this.network.destroy()
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

  }

}
