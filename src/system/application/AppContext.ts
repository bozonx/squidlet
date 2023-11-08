import {IndexedEventEmitter, pathJoin} from 'squidlet-lib'
import type {Logger} from 'squidlet-lib'
import {DRIVER_NAMES, EXTERNAL_ROOT_DIR, ROOT_DIRS} from '../../types/contstants.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesReadOnly} from '../files/FilesReadOnly.js'
import type {DriversManager} from '../driver/DriversManager.js'
import type {System} from '../System.js'
import {FilesHome} from '../files/FilesHome.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesDb} from '../files/FilesDb.js'


export class AppContext {
  appName: string

  api: Record<string, any> = {}

  // readonly files of this app
  readonly appFiles
  // local data of this app. Only for local machine
  readonly appDataLocal
  // app's syncronized data of this app between all the hosts
  readonly appDataSynced
  // file cache of this app
  readonly cacheLocal
  // config files for this app. It manages them by it self
  readonly cfgLocal
  readonly cfgSynced
  // data bases for this app
  readonly db
  // log files of this app
  readonly filesLog
  // for temporary files of this app
  readonly tmpLocal
  readonly home
  // access to external dir
  readonly external

  // TODO: add !!!!
  // memStorage only for this app
  //readonly memStorage

  private system: System

  get log(): Logger {
    return this.system.log
  }

  get drivers(): DriversManager {
    return this.system.drivers
  }

  get events(): IndexedEventEmitter {
    return this.system.events
  }


  constructor(system: System, appName: string) {
    this.appName = appName
    this.system = system

    //this.ui = new AppUiManager(system, appName)

    const filesDriver = this.system.drivers.getDriver<FilesDriver>(DRIVER_NAMES.FilesDriver)

    this.appFiles = new FilesReadOnly(filesDriver, pathJoin('/', ROOT_DIRS.appFiles, appName))
    this.appDataLocal = new FilesWrapper(filesDriver, pathJoin('/', ROOT_DIRS.appDataLocal, appName))
    this.appDataSynced = new FilesWrapper(filesDriver, pathJoin('/', ROOT_DIRS.appDataSynced, appName))
    this.cacheLocal = new FilesCache(this.system.drivers, pathJoin('/', ROOT_DIRS.cacheLocal, appName))
    this.cfgLocal = new FilesWrapper(filesDriver, pathJoin('/', ROOT_DIRS.cfgLocal, appName))
    this.cfgSynced = new FilesWrapper(filesDriver, pathJoin('/', ROOT_DIRS.cfgSynced, appName))
    this.db = new FilesDb(this.system.drivers, pathJoin('/', ROOT_DIRS.db, appName))
    this.filesLog = new FilesLog(filesDriver, pathJoin('/', ROOT_DIRS.log, appName))
    this.tmpLocal = new FilesWrapper(filesDriver, pathJoin('/', ROOT_DIRS.tmpLocal, appName))
    this.home = new FilesHome(filesDriver, pathJoin('/', ROOT_DIRS.home))
    this.external = new FilesWrapper(filesDriver, pathJoin('/', EXTERNAL_ROOT_DIR))

    //this.memStorage = new RestrictedMemStorage(this.system, appName)
  }


  async init() {
  }

  async destroy() {
  }


  registerAppUi(appName: string, staticFilesPaths: string[]) {
    this.system.appsUi.registerUi(appName, staticFilesPaths)
  }

}
