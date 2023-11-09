import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {DriversManager} from '../../system/managers/DriversManager.js'


export class FilesDb {
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    this.rootDir = rootDir
  }


}
