import {pathJoin, clearRelPathLeft} from 'squidlet-lib'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {StatsSimplified} from '../../types/io/FilesIoType.js'
import type {FilesDriverType} from '../../types/FilesDriverType.js'


/**
 * It is simple wrapper on driver but with root dir
 */

export class FilesWrapper implements FilesDriverType {
  // it is relative path of system root dir
  readonly rootDir: string
  private readonly filesDriver: FilesDriver


  constructor(filesDriver: FilesDriver, rootDir: string) {
    this.filesDriver = filesDriver
    // TODO: а зачем оно убиралось???
    //this.rootDir = clearRelPathLeft(rootDir)
    this.rootDir = rootDir
  }


  async appendFile(pathTo: string, data: string | Uint8Array) {
    return this.filesDriver.appendFile(
      pathJoin(this.rootDir, clearRelPathLeft(pathTo)),
      data
    )
  }

  async mkdir(pathTo: string) {
    return this.filesDriver.mkdir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readDir(pathTo: string): Promise<string[]> {
    return this.filesDriver.readDir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readTextFile(pathTo: string): Promise<string> {
    return this.filesDriver.readTextFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    return this.filesDriver.readBinFile(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async readlink(pathTo: string): Promise<string> {
    return this.filesDriver.readlink(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async rmdir(pathTo: string) {
    return this.filesDriver.rmdir(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async unlink(pathTo: string) {
    return this.filesDriver.unlink(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async writeFile(pathTo: string, data: string | Uint8Array) {
    return this.filesDriver.writeFile(
      pathJoin(this.rootDir, clearRelPathLeft(pathTo)),
      data
    )
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    return this.filesDriver.stat(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

  async copyFiles(files: [string, string][]) {
    return this.filesDriver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, clearRelPathLeft(src)),
        pathJoin(this.rootDir, clearRelPathLeft(dest))
      ]
    }))
  }

  async renameFiles(files: [string, string][]) {
    return this.filesDriver.copyFiles(files.map(([src, dest]) => {
      return [
        pathJoin(this.rootDir, clearRelPathLeft(src)),
        pathJoin(this.rootDir, clearRelPathLeft(dest))
      ]
    }))
  }

  async rmdirR(pathToDir: string): Promise<void> {
    return this.filesDriver.rmdirR(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  async mkDirP(pathToDir: string): Promise<void> {
    return this.filesDriver.mkDirP(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  ////////// ADDITIONAL

  async rm(pathToFileOrDir: string) {
    return this.filesDriver.rm(pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)))
  }

  async cp(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, clearRelPathLeft(src))
      : src.map((el) => pathJoin(this.rootDir, clearRelPathLeft(el)))

    return this.filesDriver.cp(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async mv(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? pathJoin(this.rootDir, clearRelPathLeft(src))
      : src.map((el) => pathJoin(this.rootDir, clearRelPathLeft(el)))

    return this.filesDriver.mv(fixedSrc, pathJoin(this.rootDir, destDir))
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    return this.filesDriver.rename(
      pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)),
      newName
    )
  }

  async isDir(pathToDir: string): Promise<boolean> {
    return this.filesDriver.isDir(pathJoin(this.rootDir, clearRelPathLeft(pathToDir)))
  }

  async isFile(pathToFile: string): Promise<boolean> {
    return this.filesDriver.isFile(pathJoin(this.rootDir, clearRelPathLeft(pathToFile)))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.filesDriver.isExists(pathJoin(this.rootDir, clearRelPathLeft(pathToFileOrDir)))
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    return this.filesDriver.isFileUtf8(pathJoin(this.rootDir, clearRelPathLeft(pathTo)))
  }

}
