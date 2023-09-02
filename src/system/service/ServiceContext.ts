import {IndexedEventEmitter, Logger, pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {DriversManager} from '../driver/DriversManager.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesDb} from '../files/FilesDb.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesVersioned} from '../files/FilesVersioned.js'
import {FilesReadOnly} from '../files/FilesReadOnly.js'
import {RestrictedMemStorage} from './RestrictedMemStorage.js'


// TODO: add system-wide access to memStorage, rootFiles


export class ServiceContext {
  private readonly system: System

  // data bases for this app
  readonly db
  // log files of this app
  readonly logFiles
  // file cache of this app
  readonly fileCache
  // config files for this app. It manages them by it self
  readonly cfg
  // files of this app
  readonly appFiles
  // some data of this app
  readonly appData
  // some shared data of this app between all the hosts. Versioned
  readonly appShared
  // for temporary files of this app
  readonly tmp

  // memStorage only for this app
  readonly memStorage

  get log(): Logger {
    return this.system.log
  }

  get drivers(): DriversManager {
    return this.system.drivers
  }

  get events(): IndexedEventEmitter {
    return this.system.events
  }


  constructor(system: System) {
    this.system = system

    const appName = ''

    // TODO: не правильно
    this.db = new FilesDb(this.system, pathJoin(ROOT_DIRS.db, appName))
    this.logFiles = new FilesLog(this.system, pathJoin(ROOT_DIRS.log, appName))
    this.fileCache = new FilesCache(this.system, pathJoin(ROOT_DIRS.cache, appName))
    this.cfg = new FilesWrapper(this.system, pathJoin(ROOT_DIRS.cfg, appName))
    this.tmp = new FilesWrapper(this.system, pathJoin(ROOT_DIRS.tmp, appName))
    this.appFiles = new FilesReadOnly(this.system, pathJoin(ROOT_DIRS.appFiles, appName))
    this.appData = new FilesWrapper(this.system, pathJoin(ROOT_DIRS.appData, appName))
    this.appShared = new FilesVersioned(this.system, pathJoin(ROOT_DIRS.appShared, appName))

    this.memStorage = new RestrictedMemStorage(this.system, appName)
  }

  async init() {
  }

  async destroy() {
  }

}
