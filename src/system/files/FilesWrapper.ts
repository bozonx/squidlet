import {pathJoin, clearRelPathLeft} from 'squidlet-lib'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {StatsSimplified} from '../../types/io/FilesIoType.js'
import type {DriversManager} from '../driver/DriversManager.js'


/**
 * It is simple wrapper on driver but with root dir
 */

export class FilesWrapper {
  // it is relative path of system root dir
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    // TODO: а зачем оно убиралось???
    //this.rootDir = clearRelPathLeft(rootDir)
    this.rootDir = rootDir
  }


  async appendFile(pathTo: string, data: string | Uint8Array) {
    return this.driver.appendFile(
      pathJoin(this.rootDir, clearRelPathLeft(pathTo)),
      data
    )
  }

  async mkdir(pathTo: string) {

    console.log(777, this.rootDir, clearRelPathLeft(pathTo), pathJoin(this.rootDir, clearRelPathLeft(pathTo)))

    return this.driver.mkdir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
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

  async rmdir(pathTo: string) {
    return this.driver.rmdir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async unlink(pathTo: string) {
    return this.driver.unlink(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async writeFile(pathTo: string, data: string | Uint8Array) {
    return this.driver.writeFile(
      pathJoin(this.rootDir, clearRelPathLeft(pathTo)),
      data
    )
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    return this.driver.stat(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async copyFiles(files: [string, string][]) {
    return this.driver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, clearRelPathLeft(src)),
        pathJoin(this.rootDir, clearRelPathLeft(dest))
      ]
    }))
  }

  async renameFiles(files: [string, string][]) {
    return this.driver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, clearRelPathLeft(src)),
        pathJoin(this.rootDir, clearRelPathLeft(dest))
      ]
    }))
  }

  async rmdirR(pathToDir: string): Promise<void> {
    return this.driver.rmdirR(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  async mkDirP(pathToDir: string): Promise<void> {
    return this.driver.mkDirP(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  ////////// ADDITIONAL

  async rm(pathToFileOrDir: string) {
    return this.driver.rm(pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)))
  }

  async cp(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, clearRelPathLeft(src))
      : src.map((el) => pathJoin(this.rootDir, clearRelPathLeft(el)))

    return this.driver.cp(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async mv(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, clearRelPathLeft(src))
      : src.map((el) => pathJoin(this.rootDir, clearRelPathLeft(el)))

    return this.driver.mv(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    return this.driver.rename(
      pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)),
      newName
    )
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
