import {isUtf8} from 'buffer'
import {pathDirname, pathJoin} from 'squidlet-lib'
import {DriverBase} from '../../system/driver/DriverBase.js'
import type {DriverContext} from '../../system/driver/DriverContext.js'
import type {DriverIndex, PermissionFileType} from '../../types/types.js'
import type FilesIoType from '../../types/io/FilesIoType.js'
import type {StatsSimplified} from '../../types/io/FilesIoType.js'
import {IO_NAMES} from '../../types/contstants.js'
import type {IoBase} from '../../system/Io/IoBase.js'



export const FilesDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new FilesDriver(ctx)
}


/**
 * Files driver
 * Use relative paths
 */
export class FilesDriver extends DriverBase {
  requireIo = [IO_NAMES.FilesIo]

  private get io(): IoBase & FilesIoType {
    return this.ctx.io.getIo(IO_NAMES.FilesIo)
  }

  //////// AS IN FILES IO
  async appendFile(pathTo: string, data: string | Uint8Array) {
    this.checkPermissions(pathTo, 'w')

    return this.io.appendFile(pathTo, data)
  }

  async mkdir(pathTo: string) {
    this.checkPermissions(pathTo, 'w')

    return this.io.mkdir(pathTo)
  }

  async readDir(pathTo: string): Promise<string[]> {
    this.checkPermissions(pathTo, 'r')

    return this.io.readdir(pathTo)
  }

  async readTextFile(pathTo: string): Promise<string> {
    this.checkPermissions(pathTo, 'r')

    return this.io.readTextFile(pathTo)
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    this.checkPermissions(pathTo, 'r')

    return this.io.readBinFile(pathTo)
  }

  async readlink(pathTo: string): Promise<string> {
    this.checkPermissions(pathTo, 'r')

    return this.io.readlink(pathTo)
  }

  async rmdir(pathTo: string) {
    this.checkPermissions(pathTo, 'w')

    return this.io.rmdir(pathTo)
  }

  async unlink(pathTo: string) {
    this.checkPermissions(pathTo, 'w')

    return this.io.unlink(pathTo)
  }

  async writeFile(pathTo: string, data: string | Uint8Array) {
    this.checkPermissions(pathTo, 'w')

    return this.io.writeFile(pathTo, data)
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    this.checkPermissions(pathTo, 'r')

    return this.io.stat(pathTo)
  }

  async copyFiles(files: [string, string][]) {
    for (const item of files) {
      this.checkPermissions(item[0], 'r')
      this.checkPermissions(item[1], 'w')
    }

    return this.io.copyFiles(files)
  }

  async renameFiles(files: [string, string][]) {
    for (const item of files) {
      this.checkPermissions(item[0], 'r')
      this.checkPermissions(item[1], 'w')
    }

    return this.io.renameFiles(files)
  }

  /**
   * Remove dir recursively
   */
  async rmdirR(pathToDir: string): Promise<void> {
    this.checkPermissions(pathToDir, 'w')

    return this.io.rmdirR(pathToDir)
  }

  /**
   * Make dir even parent dir doesn't exist
   */
  async mkDirP(pathToDir: string): Promise<void> {
    this.checkPermissions(pathToDir, 'w')

    await this.io.mkDirP(pathToDir)
  }

  ////////// ADDITIONAL

  /**
   * Remove one file or an empty dir
   */
  async rm(pathToFileOrDir: string) {
    this.checkPermissions(pathToFileOrDir, 'w')

    const stats: StatsSimplified = await this.io.stat(pathToFileOrDir)

    if (stats.dir) {
      return this.io.rmdir(pathToFileOrDir)
    }
    else {
      return this.io.unlink(pathToFileOrDir)
    }
  }

  /**
   * Copy some file, several files or dir recursively to specified dest dir
   */
  async cp(src: string | string[], destDir: string): Promise<void> {
    if (typeof src === 'string') {
      this.checkPermissions(src, 'r')
    }
    else {
      for (const item of src) this.checkPermissions(item, 'r')
    }

    this.checkPermissions(destDir, 'w')

    // TODO: !!!!
    // TODO: !!!! support copying dir recursively
  }

  /**
   * Move some file, several files or dir recursively to specified dest dir
   */
  async mv(src: string | string[], destDir: string): Promise<void> {
    if (typeof src === 'string') {
      this.checkPermissions(src, 'r')
    }
    else {
      for (const item of src) this.checkPermissions(item, 'r')
    }

    this.checkPermissions(destDir, 'w')

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

    this.checkPermissions(pathToFileOrDir, 'r')

    const fileDir: string = pathDirname(pathToFileOrDir)
    const newPath: string = pathJoin(fileDir, newName)

    this.checkPermissions(newPath, 'w')

    return this.io.renameFiles([[pathToFileOrDir, newPath]])
  }

  async isDir(pathToDir: string): Promise<boolean> {
    this.checkPermissions(pathToDir, 'r')

    const stats: StatsSimplified = await this.io.stat(pathToDir)

    return stats.dir
  }

  async isFile(pathToFile: string): Promise<boolean> {
    this.checkPermissions(pathToFile, 'r')

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
    this.checkPermissions(pathToFileOrDir, 'r')

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

  async isFileUtf8(pathTo: string): Promise<boolean> {
    this.checkPermissions(pathTo, 'r')

    // ещё есть пакет - isutf8
    // TODO: лучше считывать не весь файл, 1000 байт но кратно utf8 стандарту бит
    const data: Uint8Array = await this.io.readBinFile(pathTo)

    // TODO: поидее буфера может не быть - наверное лучше использвать в io
    //       или написать свой хэлпер
    return isUtf8(data)
  }


  private checkPermissions(pathTo: string, perm: PermissionFileType) {
    // TODO: throw an error if path is not allowed
  }

}
