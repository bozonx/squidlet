import {DriverBase} from '../../system/driver/DriverBase.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import FilesIoType from '../../types/io/FilesIoType.js'


export const FilesDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new FilesDriver(ctx)
}

const filesIoName = 'FilesIo'


export class FilesDriver extends DriverBase {
  requireIo = [filesIoName]

  private get io(): FilesIoType {
    return this.ctx.io.getIo<FilesIoType>(filesIoName)
  }


  async isDir(pathToDir: string): Promise<boolean> {

  }

  // TODO: add - isBinFile

  async isFile(pathToFile: string) {

  }

  isExists(pathToFileOrDir: string): Promise<boolean> {

  }

  readFile(pathToFile: string): Promise<string> {

  }

  readBinFile(pathToFile: string): Promise<Uint8Array> {

  }

  readDir(pathToDir: string): Promise<string[]> {

  }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {

  }

  async rm(pathToFileOrDir: string) {

  }

  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {

  }

  stat(pathToFileOrDir: string): Promise<StatsSimplified> {

  }

  async cp(fromPath: string, toPath: string): Promise<void> {

  }

  async mv(fromPath: string, toPath: string): Promise<void> {

  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {

  }

  async mkDirP(pathToDir: string): Promise<void> {

  }

  async rmRf(pathToFileOrDir: string): Promise<void> {

  }

}
