import {
  callSafely,
  IndexedEventEmitter,
  LogPublisher,
  MemStorage
} from 'squidlet-lib'
import {SystemEvents} from '../types/contstants.js'
import {IoManager} from './Io/IoManager.js'
import {SystemInfoManager} from './managers/SystemInfoManager.js'
import {ServicesManager} from './service/ServicesManager.js'
import {ApiManager} from './managers/ApiManager.js'
import {FilesManager} from './files/FilesManager.js'
import {ConfigsManager} from './config/ConfigsManager.js'
import {PermissionsManager} from './managers/PermissionsManager.js'
import {NetworkManager} from './managers/NetworkManager.js'
import type {PackageIndex} from '../types/types.js'
import {PackageManager} from './package/PackageManager.js'
import {DriversManager} from './driver/DriversManager.js'
import {AppManager} from './application/AppManager.js'
import {AppUiManager} from './application/AppUiManager.js'
//import {VersionsManager} from './files/VersionsManager.js'


export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // store some data only in memory while runtime
  readonly memStorage = new MemStorage()

  // managers
  readonly packageManager: PackageManager
  readonly io: IoManager
  readonly drivers: DriversManager
  readonly filesManager: FilesManager
  // It is wrapper for DB which is works with configs
  readonly configs: ConfigsManager
  //readonly versions: VersionsManager
  // TODO: add
  readonly systemInfo: SystemInfoManager
  // TODO: add
  readonly permissions: PermissionsManager
  readonly services: ServicesManager
  // TODO: add
  readonly network: NetworkManager
  // TODO: add
  readonly apiManager: ApiManager
  readonly apps: AppManager
  readonly appsUi: AppUiManager

  constructor() {
    this.packageManager = new PackageManager(this)
    this.io = new IoManager(this)
    this.drivers = new DriversManager(this)
    this.filesManager = new FilesManager(this)
    this.configs = new ConfigsManager(this)
    //this.versions = new VersionsManager(this)
    this.systemInfo = new SystemInfoManager(this)
    this.permissions = new PermissionsManager(this)
    this.services = new ServicesManager(this)
    this.network = new NetworkManager(this)
    this.apiManager = new ApiManager(this)
    this.apps = new AppManager(this)
    this.appsUi = new AppUiManager(this)
  }


  init() {
    (async () => {
      await this.io.init()
      await this.drivers.init()
      await this.filesManager.init()
      await this.configs.init()
      //await this.versions.init()
      await this.systemInfo.init()
      await this.permissions.init()
      await this.services.init()
      await this.network.init()
      // load all the installed packages
      await this.packageManager.loadInstalled()
      await this.apps.init()
      // notify that system is inited
      this.events.emit(SystemEvents.systemInited)
    })()
      .catch((e) => {
        this.log.error(String(e))
      })
  }

  destroy() {
    this.events.emit(SystemEvents.systemDestroying)

    // TODO: add timeout for each

    const destroyWrapper = (fn: () => Promise<void>): Promise<void> => {
      return callSafely(fn).catch((e) => this.log.error(String(e)))
    }
    // it will call destroy functions step by step
    Promise.allSettled([
      destroyWrapper(this.apps.destroy.bind(this.apps)),
      destroyWrapper(this.network.destroy.bind(this.network)),
      destroyWrapper(this.services.destroy.bind(this.services)),
      destroyWrapper(this.permissions.destroy.bind(this.permissions)),
      destroyWrapper(this.systemInfo.destroy.bind(this.systemInfo)),
      destroyWrapper(this.drivers.destroy.bind(this.drivers)),
      destroyWrapper(this.io.destroy.bind(this.io)),
      destroyWrapper(this.packageManager.destroy.bind(this.packageManager)),
    ])
      .then(() => {
        this.events.destroy()
      })
  }


  start() {
    (async () => {
      // start system's and user's services
      await this.services.startAll()
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
