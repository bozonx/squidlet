import {System} from '../System.js'
import {FilesDb} from './FilesDb.js'
import {FilesCache} from './FilesCache.js'
import {FilesLog} from './FilesLog.js'


export class FilesManager {
  // only db files
  readonly db

  // // only for configs
  // readonly cfg
  // // installed aps
  // readonly apps
  // // apps local data
  // readonly appData
  // // apps shared data between all the hosts. Versioned
  // readonly appShared
  readonly cache
  readonly log


  private readonly system: System


  constructor(system: System) {
    this.system = system

    // TODO: поидее это надо перенести в контекст сервиса и UI

    this.db = new FilesDb(this.system, 'db')

    this.cache = new FilesCache(this.system, 'cache')
    this.log = new FilesLog(this.system, 'log')
    // this.cfg = new FilesWrapper(this.system, accessToken, 'cfg')
    // this.apps = new FilesWrapper(this.system, accessToken, 'apps')
    // this.appData = new FilesWrapper(this.system, accessToken, 'appData')
    // this.appShared = new FilesVersioned(this.system, accessToken, 'appShared')
  }

  async init() {
    // TODO: создать папки
  }

  async destroy() {
  }



}
