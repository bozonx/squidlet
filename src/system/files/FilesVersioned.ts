import {clearRelPathLeft, pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {StatsSimplified} from '../../types/io/FilesIoType.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


// TODO: add versions

export class FilesVersioned {
  readonly rootDir: string

  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = clearRelPathLeft(rootDir)
  }


  async appendFile(pathTo: string, data: string | Uint8Array) {
    return this.driver.appendFile(pathJoin(this.rootDir, pathTo), data)
  }

  async mkdir(pathTo: string) {
    return this.driver.mkdir(pathJoin(this.rootDir, pathTo))
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

  async rmdir(pathTo: string) {
    return this.driver.rmdir(pathJoin(this.rootDir, pathTo))
  }

  async unlink(pathTo: string) {
    return this.driver.unlink(pathJoin(this.rootDir, pathTo))
  }

  async writeFile(pathTo: string, data: string | Uint8Array) {
    return this.driver.writeFile(pathJoin(this.rootDir, pathTo), data)
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    return this.driver.stat(pathJoin(this.rootDir, pathTo))
  }

  async copyFiles(files: [string, string][]) {
    return this.driver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, src),
        pathJoin(this.rootDir, dest)
      ]
    }))
  }

  async renameFiles(files: [string, string][]) {
    return this.driver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, src),
        pathJoin(this.rootDir, dest)
      ]
    }))
  }

  async rm(pathToFileOrDir: string) {
    return this.driver.rm(pathJoin(this.rootDir, pathToFileOrDir))
  }

  async rmRf(pathToFileOrDir: string): Promise<void> {
    return this.driver.rmRf(pathJoin(this.rootDir, pathToFileOrDir))
  }

  async cp(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, src)
      : src.map((el) => pathJoin(this.rootDir, el))

    return this.driver.cp(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async mv(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, src)
      : src.map((el) => pathJoin(this.rootDir, el))

    return this.driver.mv(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    return this.driver.rename(pathJoin(this.rootDir, pathToFileOrDir), newName)
  }

  async isFile(pathToFile: string) {
    return this.driver.isFile(pathJoin(this.rootDir, pathToFile))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.driver.isExists(pathJoin(this.rootDir, pathToFileOrDir))
  }

  async mkDirP(pathToDir: string): Promise<void> {
    return this.driver.mkDirP(pathJoin(this.rootDir, pathToDir))
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    return this.driver.isFileUtf8(pathJoin(this.rootDir, pathTo))
  }

}
