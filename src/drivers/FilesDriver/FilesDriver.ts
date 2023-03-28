import {isUtf8} from 'buffer'
import {DriverBase} from '../../system/driver/DriverBase.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import FilesIoType from '../../types/io/FilesIoType.js'


export const FilesDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new FilesDriver(ctx)
}

const filesIoName = 'FilesIo'


// TODO: должна быть проверка прав, либо делать обертку с проверкой


export class FilesDriver extends DriverBase {
  requireIo = [filesIoName]

  private get io(): FilesIoType {
    return this.ctx.io.getIo<FilesIoType>(filesIoName)
  }


  appendFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.appendFile(absPath, data);
  }

  mkdir(pathTo: string): Promise<void> {

  }

  readDir(pathToDir: string): Promise<string[]> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);

    return this.storageIo.readdir(absPath);
  }


  readTextFile(pathToFile: string): Promise<string> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.readFile(absPath);
  }

  readBinFile(pathToFile: string): Promise<Uint8Array> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.readBinFile(absPath);
  }

  readlink(pathTo: string): Promise<string> {

  }

  rmdir(pathTo: string): Promise<void> {

  }

  unlink(pathTo: string): Promise<void> {

  }

  writeFile(pathToFile: string, data: string | Uint8Array): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFile);

    return this.storageIo.writeFile(absPath, data);
  }


  stat(pathToFileOrDir: string): Promise<StatsSimplified> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageIo.stat(absPath);
  }


  ////////// ADDITIONAL

  async rm(pathToFileOrDir: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const stats: StatsSimplified = await this.storageIo.stat(pathToFileOrDir);

    if (stats.dir) {
      return this.storageIo.rmdir(absPath);
    }
    else {
      return this.storageIo.unlink(absPath);
    }
  }

  async copyFile(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support copying dir recursively
  }

  async mv(fromPath: string, toPath: string): Promise<void> {
    // TODO: !!!! support moving dir recursively

    const oldAbsPath: string = pathJoin(this.rootDir, fromPath);
    const newAbsPath: string = pathJoin(this.rootDir, toPath);

    return this.storageIo.rename(oldAbsPath, newAbsPath);
  }

  async rename(pathToFileOrDir: string, newName: string): Promise<void> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);
    const fileDir: string = pathDirname(absPath);
    const newPath: string = pathJoin(fileDir, newName);

    return this.storageIo.rename(absPath, newPath);
  }

  ///////

  async isDir(pathToDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToDir);
    const stats: StatsSimplified = await this.storageIo.stat(absPath);

    return stats.dir;
  }

  // TODO: add - isBinFile

  async isFile(pathToFile: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFile);
    const stats: StatsSimplified = await this.storageIo.stat(absPath);

    return !stats.dir;
  }

  isExists(pathToFileOrDir: string): Promise<boolean> {
    const absPath: string = pathJoin(this.rootDir, pathToFileOrDir);

    return this.storageIo.exists(absPath);
  }

  /**
   * Make dir even parent dir doesn't exist
   */
  async mkDirP(pathToDir: string): Promise<void> {
    // TODO: !!!! use helpers/mkdirPLogic.ts
  }

  /**
   * Remove dir recursively or file.
   */
  async rmRf(pathToFileOrDir: string): Promise<void> {
    // TODO: !!!!
  }


  async isFileUtf8(pathTo: string): Promise<boolean> {
    const fullPath = this.makePath(pathTo)
    // TODO: лучше считывать не весь файл, 1000 байт но кратно utf8 стандарту бит
    const buffer: Buffer = await fs.readFile(fullPath)
    // ещё есть пакет - isutf8
    return isUtf8(buffer)
  }

}
