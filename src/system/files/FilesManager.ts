import {System} from '../System.js'
import {FilesDb} from './FilesDb.js'
import {FilesWrapper} from './FilesWrapper.js'
import {FilesVersioned} from './FilesVersioned.js'
import {FilesCache} from './FilesCache.js'
import {FilesLog} from './FilesLog.js'


export class FilesManager {
  // only for configs
  readonly cfg
  // only db files
  readonly db
  // installed aps
  readonly apps
  // apps local data
  readonly appData
  // apps shared data between all the hosts. Versioned
  readonly appShared
  // user data versioned and shared between all the hosts
  readonly userData
  readonly cache
  readonly log
  readonly tmp
  // some extenal file system, can be any mounted fs
  readonly external

  private readonly system: System


  constructor(system: System) {
    this.system = system
    this.cfg = new FilesWrapper(this.system, 'cfg')
    this.db = new FilesDb(this.system, 'db')
    this.apps = new FilesWrapper(this.system, 'apps')
    this.appData = new FilesWrapper(this.system, 'appData')
    this.appShared = new FilesVersioned(this.system, 'appShared')
    this.userData = new FilesVersioned(this.system, 'userData')
    this.cache = new FilesCache(this.system, 'cache')
    this.log = new FilesLog(this.system, 'log')
    this.tmp = new FilesWrapper(this.system, 'tmp')
    this.external = new FilesWrapper(this.system, 'external')
  }

  async init() {
  }

  async destroy() {
  }



}
