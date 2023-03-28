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


/**
 * Files driver
 * Use relative paths
 */
export class FilesDriver extends DriverBase {
  requireIo = [filesIoName]

  private get io(): FilesIoType {
    return this.ctx.io.getIo<FilesIoType>(filesIoName)
  }

  //////// AS IN FILES IO
  appendFile = this.io.appendFile.bind(this)
  mkdir = this.io.mkdir.bind(this)
  readDir = this.io.readdir.bind(this)
  readTextFile = this.io.readTextFile.bind(this)
  readBinFile = this.io.readBinFile.bind(this)
  readlink = this.io.readlink.bind(this)
  rmdir = this.io.rmdir.bind(this)
  unlink = this.io.unlink.bind(this)
  writeFile = this.io.writeFile.bind(this)
  stat = this.io.stat.bind(this)

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

  async isFile(pathToFile: string) {
    const absPath: string = pathJoin(this.rootDir, pathToFile);
    const stats: StatsSimplified = await this.storageIo.stat(absPath);

    return !stats.dir;
  }

  // TODO: может вместо этого использовать stat?
  // Do it only for simple checks not before read or write
  // because the file can be removed between promises
  //exists(pathTo: string): Promise<boolean>
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
