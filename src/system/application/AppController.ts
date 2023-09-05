import {IndexedEventEmitter, Logger, pathJoin} from 'squidlet-lib'
import {FilesDb} from '../files/FilesDb.js'
import {ROOT_DIRS} from '../../types/contstants.js'
import {FilesLog} from '../files/FilesLog.js'
import {FilesCache} from '../files/FilesCache.js'
import {FilesWrapper} from '../files/FilesWrapper.js'
import {FilesReadOnly} from '../files/FilesReadOnly.js'
import {FilesVersioned} from '../files/FilesVersioned.js'
import {RestrictedMemStorage} from '../service/RestrictedMemStorage.js'
import {AppContext} from './AppContext.js'


export class AppController {
  api: Record<string, any> = {}

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

  private ctx: AppContext

  constructor(ctx: AppContext) {
    this.ctx = ctx

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


  // async init() {
  // }
  //
  // async destroy() {
  // }

}
