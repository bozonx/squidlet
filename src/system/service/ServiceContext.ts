import {System} from '../System.js'
import {IndexedEventEmitter, Logger} from 'squidlet-lib'
import {DriversManager} from '../driver/DriversManager.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesDb} from '../files/FilesDb.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesVersioned} from '../files/FilesVersioned.js'


export class ServiceContext {
  private readonly system: System
  // files of this app
  readonly appFiles
  // some data of this app
  readonly appData
  // some shared data of this app between all the hosts. Versioned
  readonly appShared
  // file cache of this app
  readonly fileCache
  // log files of this app
  readonly logFiles
  // data bases for this app
  readonly db
  // configs for this app
  readonly cfg
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


    this.appFiles = new FilesWrapper(this.system, accessToken, 'apps')
    this.appData = new FilesWrapper(this.system, accessToken, 'appData')
    this.appShared = new FilesVersioned(this.system, accessToken, 'appShared')

    this.db = new FilesDb(this.system, 'db')
    this.cache = new FilesCache(this.system, 'cache')
    this.log = new FilesLog(this.system, 'log')
    this.cfg = new FilesWrapper(this.system, accessToken, 'cfg')
    this.tmp = new FilesWrapper(this.system, accessToken, 'tmp')

  }

  async init() {
  }

  async destroy() {
  }

}
