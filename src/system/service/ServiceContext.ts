import {IndexedEventEmitter, Logger, pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {DriversManager} from '../driver/DriversManager.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesDb} from '../files/FilesDb.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesVersioned} from '../files/FilesVersioned.js'
import {FilesConfig} from '../files/FilesConfig.js'


export class ServiceContext {
  private readonly system: System

  // data bases for this app
  readonly db
  // log files of this app
  readonly logFiles
  // file cache of this app
  readonly fileCache
  // configs for this app
  readonly cfg
  // files of this app
  readonly appFiles
  // some data of this app
  readonly appData
  // some shared data of this app between all the hosts. Versioned
  readonly appShared
  // for temporary files of this app
  readonly tmp

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

    this.db = new FilesDb(this.system, pathJoin('db', appName))
    this.logFiles = new FilesLog(this.system, pathJoin('log', appName))
    this.fileCache = new FilesCache(this.system, pathJoin('cache', appName))
    this.cfg = new FilesConfig(this.system, pathJoin('cfg', appName))
    this.appFiles = new FilesWrapper(this.system, pathJoin('apps', appName))
    this.appData = new FilesWrapper(this.system, pathJoin('appData', appName))
    this.appShared = new FilesVersioned(this.system, pathJoin('appShared', appName))
    this.tmp = new FilesWrapper(this.system, pathJoin('tmp', appName))
  }

  async init() {
  }

  async destroy() {
  }

}
