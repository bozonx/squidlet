import {System} from '../System.js'
import {FilesDb} from '../files/FilesDb.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesVersioned} from '../files/FilesVersioned.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesLog} from '../files/FilesLog.js'


/*
 * Папки
 * * db - файлы где только хранятся бд
 * * apps - файлы куда устанавливаются файлы приложений
 * * appData - файлы для программ, которые изменяют они сами. Локально для системы
 * * appShared - файлы для программ, Версионированная и синхронизируемая
 * * userData - файлы пользователя. Версионированная и синхронизируемая
 * * cache - только локальный
 * * log - локальный для системы
 * *
 */


export class FilesManager {
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

  private readonly system: System


  constructor(system: System) {
    this.system = system
    this.db = new FilesDb(this.system, 'db')
    this.apps = new FilesWrapper(this.system, 'apps')
    this.appData = new FilesWrapper(this.system, 'appData')
    this.appShared = new FilesVersioned(this.system, 'appShared')
    this.userData = new FilesVersioned(this.system, 'userData')
    this.cache = new FilesCache(this.system, 'cache')
    this.log = new FilesLog(this.system, 'log')
  }

  async init() {
  }

  async destroy() {
  }



}
