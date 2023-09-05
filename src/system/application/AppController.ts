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
  appName: string

  api: Record<string, any> = {}

  // data bases for this app
  //readonly db
  // log files of this app
  readonly logFiles
  // file cache of this app
  readonly fileCache
  // config files for this app. It manages them by it self
  readonly cfg
  // files of this app
  readonly appFiles
  // local data of this app. Only for this machine
  readonly appDataLocal
  // some shared data of this app between all the hosts. Versioned
  readonly appDataSynced
  // for temporary files of this app
  readonly tmp

  // memStorage only for this app
  //readonly memStorage

  private ctx: AppContext

  constructor(ctx: AppContext, appName: string) {
    this.appName = appName
    this.ctx = ctx

    //this.db = new FilesDb(this.system, pathJoin(ROOT_DIRS.db, appName))
    this.logFiles = new FilesLog(this.ctx.drivers, pathJoin(ROOT_DIRS.log, appName))
    this.fileCache = new FilesCache(this.ctx.drivers, pathJoin(ROOT_DIRS.cache, appName))
    this.cfg = new FilesWrapper(this.ctx.drivers, pathJoin(ROOT_DIRS.cfg, appName))
    this.tmp = new FilesWrapper(this.ctx.drivers, pathJoin(ROOT_DIRS.tmp, appName))
    this.appFiles = new FilesReadOnly(this.ctx.drivers, pathJoin(ROOT_DIRS.appFiles, appName))
    this.appDataLocal = new FilesWrapper(this.ctx.drivers, pathJoin(ROOT_DIRS.appDataLocal, appName))
    this.appDataSynced = new FilesVersioned(
      this.ctx.drivers,
      pathJoin(ROOT_DIRS.appDataSynced, appName)
    )

    //this.memStorage = new RestrictedMemStorage(this.system, appName)
  }


  async init() {
  }

  async destroy() {
    // TODO: wait while writing proccess in progress
  }

}
