import {isUtf8} from 'buffer'
import {pathDirname, pathJoin} from 'squidlet-lib'
import {DriverBase} from '../../system/driver/DriverBase.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import FilesIoType, {StatsSimplified} from '../../types/io/FilesIoType.js'


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
  copyFiles = this.io.copyFiles.bind(this)
  renameFiles = this.io.renameFiles.bind(this)

  ////////// ADDITIONAL

  /**
   * Remove one file or an empty dir
   */
  async rm(pathToFileOrDir: string) {
    const stats: StatsSimplified = await this.io.stat(pathToFileOrDir)

    if (stats.dir) {
      return this.io.rmdir(pathToFileOrDir)
    }
    else {
      return this.io.unlink(pathToFileOrDir)
    }
  }

  /**
   * Remove one file of dir recursively
   */
  async rmRf(pathToFileOrDir: string): Promise<void> {
    // TODO: !!!!
  }

  /**
   * Copy some file, several files or dir recursively to specified dest dir
   */
  async cp(src: string | string[], destDir: string): Promise<void> {
    // TODO: !!!!
    // TODO: !!!! support copying dir recursively
  }

  /**
   * Move some file, several files or dir recursively to specified dest dir
   */
  async mv(src: string | string[], destDir: string): Promise<void> {
    // TODO: !!!! support moving dir recursively

    // const oldAbsPath: string = pathJoin(this.rootDir, fromPath);
    // const newAbsPath: string = pathJoin(this.rootDir, toPath);
    //
    // return this.storageIo.rename(oldAbsPath, newAbsPath);
  }

  /**
   * Change name of file or dir
   */
  async rename(pathToFileOrDir: string, newName: string): Promise<void> {

    // TODO: проверить сработает ли с полной папкой

    const fileDir: string = pathDirname(pathToFileOrDir)
    const newPath: string = pathJoin(fileDir, newName)

    return this.io.renameFiles([[pathToFileOrDir, newPath]])
  }

  async isDir(pathToDir: string): Promise<boolean> {
    const stats: StatsSimplified = await this.io.stat(pathToDir)

    return stats.dir
  }

  async isFile(pathToFile: string) {
    const stats: StatsSimplified = await this.io.stat(pathToFile)

    return !stats.dir
  }

  /**
   * Is file exists.
   * Do it only for simple checks not before read or write.
   *   because the file can be removed between promises
   * @param pathToFileOrDir
   */
  async isExists(pathToFileOrDir: string): Promise<boolean> {

    // TODO: проверить что stat вернет ошибку если файла нет
    // TODO: и какую именно ошибку
    //await fs.access(fullPath)

    try {
      await this.io.stat(pathToFileOrDir)

      return true
    }
    catch (e) {
      return false
    }
  }

  /**
   * Make dir even parent dir doesn't exist
   */
  async mkDirP(pathToDir: string): Promise<void> {
    // TODO: !!!! use helpers/mkdirPLogic.ts
  }


  async isFileUtf8(pathTo: string): Promise<boolean> {
    // ещё есть пакет - isutf8
    // TODO: лучше считывать не весь файл, 1000 байт но кратно utf8 стандарту бит
    const data: Uint8Array = await this.io.readBinFile(pathTo)
    return isUtf8(data)
  }

}
