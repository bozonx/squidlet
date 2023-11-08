import {pathDirname, pathJoin} from 'squidlet-lib'
import type {LogLevel} from 'squidlet-lib'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {StatsSimplified} from '../../types/io/FilesIoType.js'
import type {DriversManager} from '../driver/DriversManager.js'


export class FilesLog {
  readonly rootDir: string

  private readonly drivers: DriversManager

  private get driver(): FilesDriver {
    return this.drivers.getDriver('FilesDriver')
  }


  constructor(drivers: DriversManager, rootDir: string) {
    this.drivers = drivers
    this.rootDir = clearRelPathLeft(rootDir)
  }


  /**
   * Append to existent file or create it if doesn't exists
   */
  async write(pathToLog: string, data: string, logLevel: LogLevel) {
    const fullPath = pathJoin(this.rootDir, clearRelPathLeft(pathToLog))
    // TODO: add date and time and log level
    const fullLog = data
    // create dir if need
    await this.driver.mkDirP(pathDirname(fullPath))

    try {
      await this.driver.appendFile(fullPath, fullLog)
    }
    catch (e) {
      // TODO: ошибка должна быть только связанна с тем что файл уже существует
      // TODO: а может appendFile уже подразумевает создание файла ????
      throw e
    }

    // TODO: поддержка ротации
  }

  async readLogFile(pathTo: string): Promise<string> {
    // TODO: файл может быть большой - считывать только указанное количество строк с конца
    return this.driver.readTextFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  //////

  async mkdir(pathTo: string) {
    return this.driver.mkdir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readDir(pathTo: string): Promise<string[]> {
    return this.driver.readDir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
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

  async isFile(pathToFile: string) {
    return this.driver.isFile(pathJoin(this.rootDir, clearRelPathLeft(pathToFile)))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.driver.isExists(pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)))
  }

}
