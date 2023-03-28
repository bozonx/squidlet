import {System} from '../System.js'
import {FilesDb} from './FilesDb.js'
import {FilesCache} from './FilesCache.js'
import {FilesLog} from './FilesLog.js'


export class FilesManager {
  // only db files
  readonly db


  readonly cache
  readonly log


  private readonly system: System


  constructor(system: System) {
    this.system = system

    // TODO: поидее это надо перенести в контекст сервиса и UI

    this.db = new FilesDb(this.system, 'db')

    this.cache = new FilesCache(this.system, 'cache')
    this.log = new FilesLog(this.system, 'log')

  }

  async init() {
    // TODO: создать папки
  }

  async destroy() {
  }



}
