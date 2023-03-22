import {callSafely, IndexedEventEmitter} from 'squidlet-lib'
import {LogPublisher} from 'squidlet-lib'
import {SystemEvents} from '../types/contstants.js'
import {IoManager} from './Io/IoManager.js'
import {SystemInfoManager} from './managers/SystemInfoManager.js'
import {ServicesManager} from './service/ServicesManager.js'
import {ApiManager} from './api/ApiManager.js'
import {CmdManager} from './managers/CmdManager.js'
import {FilesManager} from './managers/FilesManager.js'
import {DbManager} from './managers/DbManager.js'
import {CacheManager} from './managers/CacheManager.js'
import {ConfigsManager} from './managers/ConfigsManager.js'
import {PermissionsManager} from './managers/PermissionsManager.js'
import {UiManager} from './ui/UiManager.js'
import {ExecManager} from './managers/ExecManager.js'
import {NetworkManager} from './managers/NetworkManager.js'
import {Package} from '../types/types.js'
import {PackageManager} from './package/PackageManager.js'
import {DriversManager} from './driver/DriversManager.js'


// TODO: add timer driver wrapper
// TODO: add system time driver wrapper
// TODO: распределённая служба заданний
// TODO: realtime api
// TODO: распределённый etc
// TODO: вычисление мастера

export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // managers
  readonly io: IoManager
  readonly drivers: DriversManager
  // DRIVERS
  readonly exec: ExecManager
  readonly systemInfo: SystemInfoManager
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
  readonly packageManager: PackageManager


  constructor() {
    this.io = new IoManager(this)
    this.drivers = new DriversManager(this)
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
    this.packageManager = new PackageManager(this)
  }


  init() {
    (async () => {
      await this.io.init()
      await this.drivers.init()
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
      await this.packageManager.init()
      // notify that system is inited
      this.events.emit(SystemEvents.systemInited)
    })()
      .catch((e) => {
        // TODO: what to do???
      })
  }

  destroy() {
    this.events.emit(SystemEvents.systemDestroying)

    const destroyWrapper = (fn: () => Promise<void>): Promise<void> => {
      return callSafely(fn).catch((e) => this.log.error(String(e)))
    }
    // it will call destroy functions step by step
    Promise.allSettled([
      destroyWrapper(this.packageManager.destroy),
      destroyWrapper(this.ui.destroy),
      destroyWrapper(this.cmd.destroy),
      destroyWrapper(this.apiManager.destroy),
      destroyWrapper(this.network.destroy),
      destroyWrapper(this.services.destroy),
      destroyWrapper(this.permissions.destroy),
      destroyWrapper(this.configs.destroy),
      destroyWrapper(this.db.destroy),
      destroyWrapper(this.cache.destroy),
      destroyWrapper(this.files.destroy),
      destroyWrapper(this.systemInfo.destroy),
      destroyWrapper(this.exec.destroy),
      destroyWrapper(this.drivers.destroy),
      destroyWrapper(this.io.destroy),
    ])
      .then(() => {
        this.events.destroy()
      })
  }


  async start() {
    (async () => {
      // start system's and user's services
      await this.services.start()
      // TODO: выполнение пользовательских startup скриптов, где могут быть указанны apps
      // notify that system is started
      this.events.emit(SystemEvents.systemStarted)
    })()
      .catch((e) => {
        // TODO: what to do???
      })
  }

  use(pkg: Package) {
    pkg(this.packageManager.ctx)
  }

}
