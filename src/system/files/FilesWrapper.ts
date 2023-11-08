import type {FilesDriverType} from '../../types/FilesDriverType.js'
import {FilesReadOnly} from './FilesReadOnly.js'


/**
 * It is simple wrapper on driver but with root dir
 */
export class FilesWrapper extends FilesReadOnly implements FilesDriverType {
  async appendFile(pathTo: string, data: string | Uint8Array) {
    return this.filesDriver.appendFile(this.preparePath(pathTo), data)
  }

  async mkdir(pathTo: string) {
    return this.filesDriver.mkdir(this.preparePath(pathTo))
  }

  async rmdir(pathTo: string) {
    return this.filesDriver.rmdir(this.preparePath(pathTo))
  }

  async unlink(pathTo: string) {
    return this.filesDriver.unlink(this.preparePath(pathTo))
  }

  async writeFile(pathTo: string, data: string | Uint8Array) {
    return this.filesDriver.writeFile(this.preparePath(pathTo), data)
  }

  async copyFiles(files: [string, string][]) {
    return this.filesDriver.copyFiles(files.map(([src, dest]) => {
      return [ this.preparePath(src), this.preparePath(dest) ]
    }))
  }

  async renameFiles(files: [string, string][]) {
    return this.filesDriver.copyFiles(files.map(([src, dest]) => {
      return [ this.preparePath(src), this.preparePath(dest) ]
    }))
  }

  async rmdirR(pathToDir: string): Promise<void> {
    return this.filesDriver.rmdirR(this.preparePath(pathToDir))
  }

  async mkDirP(pathToDir: string): Promise<void> {
    return this.filesDriver.mkDirP(this.preparePath(pathToDir))
  }

  ////////// ADDITIONAL

  async rm(pathToFileOrDir: string) {
    return this.filesDriver.rm(this.preparePath(pathToFileOrDir))
  }

  async cp(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? this.preparePath(src)
      : src.map((el) => this.preparePath(el))

    return this.filesDriver.cp(fixedSrc, this.preparePath(destDir))
  }

  async mv(src: string | string[], destDir: string): Promise<void> {
    const fixedSrc = (typeof src === 'string')
      ? this.preparePath(src)
      : src.map((el) => this.preparePath(el))

    return this.filesDriver.mv(fixedSrc, this.preparePath(destDir))
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    return this.filesDriver.rename(this.preparePath(pathToFileOrDir), newName)
  }

}
