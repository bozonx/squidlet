import {pathJoin, clearRelPathLeft} from 'squidlet-lib'
import {System} from '../System.js'
import {StatsSimplified} from '../../types/io/FilesIoType.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {DriversManager} from '../driver/DriversManager.js'


export class FilesReadOnly {
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    this.rootDir = clearRelPathLeft(rootDir)
  }


  async readDir(pathTo: string): Promise<string[]> {
    return this.driver.readDir(pathJoin(this.rootDir, pathTo))
  }

  async readTextFile(pathTo: string): Promise<string> {
    return this.driver.readTextFile(pathJoin(this.rootDir, pathTo))
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    return this.driver.readBinFile(pathJoin(this.rootDir, pathTo))
  }

  async readlink(pathTo: string): Promise<string> {
    return this.driver.readlink(pathJoin(this.rootDir, pathTo))
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    return this.driver.stat(pathJoin(this.rootDir, pathTo))
  }

  async isDir(pathToDir: string): Promise<boolean> {
    return this.driver.isDir(pathJoin(this.rootDir, pathToDir))
  }

  async isFile(pathToFile: string) {
    return this.driver.isFile(pathJoin(this.rootDir, pathToFile))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.driver.isExists(pathJoin(this.rootDir, pathToFileOrDir))
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    return this.driver.isFileUtf8(pathJoin(this.rootDir, pathTo))
  }

}
