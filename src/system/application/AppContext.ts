import {IndexedEventEmitter, Logger, pathJoin} from 'squidlet-lib'
import {ROOT_DIRS} from '../../types/contstants.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesReadOnly} from '../files/FilesReadOnly.js'
import {DriversManager} from '../driver/DriversManager.js'
import {System} from '../System.js'
import {AppUiManager} from './AppUiManager.js'


export class AppContext {
  appName: string

  api: Record<string, any> = {}

  //readonly ui

  // data bases for this app
  //readonly db
  // log files of this app
  readonly logFiles
  // file cache of this app
  //readonly fileCache
  // config files for this app. It manages them by it self
  readonly cfg
  // files of this app
  readonly appFiles
  // local data of this app. Only for this machine
  readonly appDataLocal
  // app's syncronized data of this app between all the hosts. Versioned
  //readonly appDataSynced
  // for temporary files of this app
  readonly tmp

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
    //this.db = new FilesDb(this.system, pathJoin(ROOT_DIRS.db, appName))
    this.logFiles = new FilesLog(
      this.system.drivers,
      pathJoin('/', ROOT_DIRS.log, appName)
    )
    // this.fileCache = new FilesCache(
    //   this.system.drivers,
    //   pathJoin('/', ROOT_DIRS.cache, appName)
    // )
    this.cfg = new FilesWrapper(
      this.system.drivers,
      pathJoin('/', ROOT_DIRS.cfg, appName)
    )
    this.tmp = new FilesWrapper(
      this.system.drivers,
      pathJoin('/', ROOT_DIRS.tmp, appName)
    )
    this.appFiles = new FilesReadOnly(
      this.system.drivers,
      pathJoin('/', ROOT_DIRS.appFiles, appName)
    )
    this.appDataLocal = new FilesWrapper(
      this.system.drivers,
      pathJoin('/', ROOT_DIRS.appDataLocal, appName)
    )
    // this.appDataSynced = new FilesVersioned(
    //   this.system.drivers,
    //   pathJoin('/', ROOT_DIRS.appDataSynced, appName)
    // )

    //this.memStorage = new RestrictedMemStorage(this.system, appName)
  }


  async init() {
  }

  async destroy() {
    // TODO: wait while writing proccess in progress
  }


  registerAppUi(appName: string, staticFilesPaths: string[]) {
    this.system.appsUi.registerUi(appName, staticFilesPaths)
  }

}
