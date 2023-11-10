import {clearRelPath, pathJoin, trimCharStart} from 'squidlet-lib'
import type {StatsSimplified} from '../../types/io/FilesIoType.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import type {ReadOnlyFilesDriverType} from '../../types/FilesDriverType.js'


export class FilesReadOnly implements ReadOnlyFilesDriverType {
  // it is dir where this wrapper is allowed to work
  readonly rootDir: string
  protected readonly filesDriver: FilesDriver


  constructor(filesDriver: FilesDriver, rootDir: string) {
    this.filesDriver = filesDriver
    this.rootDir = rootDir
  }


  async readDir(pathTo: string): Promise<string[]> {
    return this.filesDriver.readDir(this.preparePath(pathTo))
  }

  async readTextFile(pathTo: string): Promise<string> {
    return this.filesDriver.readTextFile(this.preparePath(pathTo))
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    return this.filesDriver.readBinFile(this.preparePath(pathTo))
  }

  async readlink(pathTo: string): Promise<string> {
    return this.filesDriver.readlink(this.preparePath(pathTo))
  }

  async stat(pathTo: string): Promise<StatsSimplified | undefined> {
    return this.filesDriver.stat(this.preparePath(pathTo))
  }

  async isDir(pathToDir: string): Promise<boolean> {
    return this.filesDriver.isDir(this.preparePath(pathToDir))
  }

  async isFile(pathToFile: string): Promise<boolean> {
    return this.filesDriver.isFile(this.preparePath(pathToFile))
  }

  async isExists(pathToFileOrDir: string): Promise<boolean> {
    return this.filesDriver.isExists(this.preparePath(pathToFileOrDir))
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    return this.filesDriver.isFileUtf8(this.preparePath(pathTo))
  }


  protected preparePath(pathTo: string): string {
    return pathJoin(this.rootDir, trimCharStart(clearRelPath(pathTo), '/'))
  }
}
