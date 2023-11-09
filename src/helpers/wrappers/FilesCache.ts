import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {DriversManager} from '../../system/managers/DriversManager.js'


// TODO: файлы сразу сохранять и одновременно держать в памяти несколько секунд
// TODO: если протухание короткое то держать только в памяти

interface CacheParams {
  // if set this id will be used
  // if not set it will be generated
  id?: string
  // num in seconds when cache will be expired
  expiredSec?: number
  // if true cache will reset expiration on each access.
  // if false access doesn't matter, it will be expired any way
  expiredAfterLastAccess?: boolean
}


export class FilesCache {
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    this.rootDir = rootDir
  }


  async getCache(idOrName: string): Promise<string | undefined> {
    // TODO: сначала проверить в памяти - memStorage
    // TODO: если нет то в файле
    return
  }

  async setCache(data: string, params?: CacheParams): Promise<string> {
    const id = params?.id || ''

    // TODO: сгенерировать id
    // TODO: сохранить в память
    // TODO: сохранить на диск

    return id
  }

}
