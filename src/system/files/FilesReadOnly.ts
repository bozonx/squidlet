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
    return this.driver.readDir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readTextFile(pathTo: string): Promise<string> {
    return this.driver.readTextFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    return this.driver.readBinFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readlink(pathTo: string): Promise<string> {
    return this.driver.readlink(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    return this.driver.stat(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async isDir(pathToDir: string): Promise<boolean> {
    return this.driver.isDir(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  async isFile(pathToFile: string): Promise<boolean> {
    return this.driver.isFile(pathJoin(this.rootDir, clearRelPathLeft(pathToFile)))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.driver.isExists(pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)))
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    return this.driver.isFileUtf8(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

}
