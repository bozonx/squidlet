import {callSafely, IndexedEventEmitter, LogPublisher} from 'squidlet-lib'
import {SystemEvents} from '../types/contstants.js'
import {IoManager} from './Io/IoManager.js'
import {ServicesManager} from './service/ServicesManager.js'
import {ApiManager} from './managers/ApiManager.js'
import {FilesManager} from './managers/FilesManager.js'
import {ConfigsManager} from './managers/ConfigsManager.js'
import {PermissionsManager} from './managers/PermissionsManager.js'
import type {PackageIndex} from '../types/types.js'
import {PackageManager} from './package/PackageManager.js'
import {DriversManager} from './driver/DriversManager.js'
import {AppManager} from './application/AppManager.js'
import {AppUiManager} from './application/AppUiManager.js'


export class System {
  readonly events = new IndexedEventEmitter()
  readonly log = new LogPublisher(
    (...p) => this.events.emit(SystemEvents.logger, ...p)
  )
  // managers
  readonly packageManager = new PackageManager(this)
  readonly io = new IoManager(this)
  readonly drivers = new DriversManager(this)
  readonly filesManager = new FilesManager(this)
  // It is wrapper for DB which is works with configs
  readonly configs = new ConfigsManager(this)
  // TODO: add
  readonly permissions = new PermissionsManager(this)
  readonly services = new ServicesManager(this)
  // TODO: add
  readonly apiManager = new ApiManager(this)
  readonly apps = new AppManager(this)
  readonly appsUi = new AppUiManager(this)

  constructor() {
  }


  init() {
    (async () => {
      await this.io.init()
      await this.drivers.init()
      await this.filesManager.init()
      await this.configs.init()
      await this.permissions.init()
      await this.services.init()
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

    // TODO: add timeout for each item

    const destroyWrapper = (fn: () => Promise<void>): Promise<void> => {
      return callSafely(fn).catch((e) => this.log.error(String(e)))
    }
    // it will call destroy functions step by step
    Promise.allSettled([
      destroyWrapper(this.apps.destroy.bind(this.apps)),
      destroyWrapper(this.services.destroy.bind(this.services)),
      destroyWrapper(this.permissions.destroy.bind(this.permissions)),
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
