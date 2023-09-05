import {clearRelPathLeft} from 'squidlet-lib'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {DriversManager} from '../driver/DriversManager.js'


export class FilesDb {
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    this.rootDir = clearRelPathLeft(rootDir)
  }


}
