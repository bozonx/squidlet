import {callSafely, IndexedEventEmitter} from 'squidlet-lib'
import {LogPublisher, MemStorage} from 'squidlet-lib'
import {SystemEvents} from '../types/contstants.js'
import {IoManager} from './Io/IoManager.js'
import {SystemInfoManager} from './managers/SystemInfoManager.js'
import {ServicesManager} from './service/ServicesManager.js'
import {ApiManager} from './api/ApiManager.js'
import {CmdManager} from './managers/CmdManager.js'
import {FilesManager} from './files/FilesManager.js'
import {DbManager} from './managers/DbManager.js'
import {CacheManager} from './managers/CacheManager.js'
import {ConfigsManager} from './config/ConfigsManager.js'
import {PermissionsManager} from './managers/PermissionsManager.js'
import {UiManager} from './ui/UiManager.js'
import {NetworkManager} from './managers/NetworkManager.js'
import {PackageIndex} from '../types/types.js'
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
  // store some data only in memory while runtime
  // TODO: ограничить правами только на свой dir
  readonly memStorage: MemStorage
  // TODO: ограничить правами только на свой dir
  // TODO: слушать события и сохранять в файл всё что передаётся
  //readonly localStorage: MemStorage
  readonly drivers: DriversManager
  // DRIVERS
  // TODO: add
  readonly systemInfo: SystemInfoManager
  // SYSTEM
  // TODO: add
  readonly permissions: PermissionsManager
  // SERVICES
  readonly services: ServicesManager
  readonly files: FilesManager
  // TODO: add
  readonly cache: CacheManager
  // TODO: add !!!!!!
  readonly db: DbManager
  // It is wrapper for DB which is works with configs
  // TODO: add
  readonly configs: ConfigsManager
  // TODO: add !!!!!!
  readonly network: NetworkManager
  // it is service
  // TODO: add
  readonly ui: UiManager
  // TODO: add !!!!!!
  readonly apiManager: ApiManager
  // it is wrapper for api
  // TODO: add
  readonly cmd: CmdManager
  readonly packageManager: PackageManager


  constructor() {
    this.io = new IoManager(this)
    this.memStorage = new MemStorage()
    this.drivers = new DriversManager(this)
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
      // TODO: загрузку пакетов делать как можно раньше чтобы загрузились IO и драйвера
      // load all the installed packages
      await this.packageManager.init()
      // notify that system is inited
      this.events.emit(SystemEvents.systemInited)
    })()
      .catch((e) => {
        this.log.error(String(e))
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
      await this.cmd.startInitScripts()
      // notify that system is started
      this.events.emit(SystemEvents.systemStarted)
    })()
      .catch((e) => {
        this.log.error(String(e))
      })
  }

  use(pkg: PackageIndex) {
    pkg(this.packageManager.ctx)
  }

}
