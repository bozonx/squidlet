import fs from 'node:fs/promises'
import {Stats, existsSync} from 'node:fs'
import {isUtf8} from 'buffer'
import {pathJoin, PATH_SEP, trimCharEnd, DEFAULT_ENCODE, convertBufferToUint8Array} from 'squidlet-lib'
import FilesIoType, {FilesIoConfig, StatsSimplified} from '../../../types/io/FilesIoType.js'
import {IoBase} from '../../../system/Io/IoBase.js'


const cfg: FilesIoConfig = {
  rootDir: trimCharEnd(process.env.FILES_ROOT_DIR || '', PATH_SEP),
  uid: (process.env.FILES_UID) ? Number(process.env.FILES_UID) : undefined,
  gid: (process.env.FILES_GID) ? Number(process.env.FILES_GID) : undefined,
}

if (!cfg.rootDir) throw new Error(`FilesIo: no rootDir in config`)


export default class FilesIo extends IoBase implements FilesIoType {
  async appendFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    const fullPath = this.makePath(pathTo)
    const wasExist: boolean = existsSync(pathTo)

    if (typeof data === 'string') {
      await fs.appendFile(fullPath, data, DEFAULT_ENCODE)
    }
    else {
      await fs.appendFile(fullPath, data)
    }

    if (!wasExist) await this.chown(fullPath)
  }

  async mkdir(pathTo: string): Promise<void> {
    const fullPath = this.makePath(pathTo)

    await fs.mkdir(fullPath)

    return this.chown(fullPath)
  }

  readdir(pathTo: string): Promise<string[]> {
    const fullPath = this.makePath(pathTo)

    return fs.readdir(fullPath, DEFAULT_ENCODE)
  }

  async readTextFile(pathTo: string): Promise<string> {
    const fullPath = this.makePath(pathTo);

    return await fs.readFile(fullPath, DEFAULT_ENCODE)
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    const fullPath = this.makePath(pathTo);

    const buffer: Buffer = await fs.readFile(fullPath)

    return convertBufferToUint8Array(buffer)
  }

  readlink(pathTo: string): Promise<string> {
    const fullPath = this.makePath(pathTo)

    return fs.readlink(fullPath)
  }

  rmdir(pathTo: string): Promise<void> {
    const fullPath = this.makePath(pathTo)

    return fs.rmdir(fullPath)
  }

  unlink(pathTo: string): Promise<void> {
    const fullPath = this.makePath(pathTo)

    return fs.unlink(fullPath)
  }

  async writeFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    const fullPath = this.makePath(pathTo)

    if (typeof data === 'string') {
      await fs.writeFile(fullPath, data, DEFAULT_ENCODE)
    }
    else {
      await fs.writeFile(fullPath, data)
    }

    await this.chown(fullPath)
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    const fullPath = this.makePath(pathTo)
    const stat = await fs.lstat(fullPath)

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      symbolicLink: stat.isSymbolicLink(),
      mtime: stat.mtime.getTime(),
    };
  }

  async exists(pathTo: string): Promise<boolean> {
    const fullPath = this.makePath(pathTo)

    try {
      await fs.access(fullPath)

      return true
    }
    catch (e) {
      return false
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const resolvedDest = this.makePath(dest);

    await fs.copyFile(this.makePath(src), resolvedDest)

    return  this.chown(resolvedDest)
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const resolvedNewPath = this.makePath(newPath)

    await fs.rename(this.makePath(oldPath), resolvedNewPath)

    return this.chown(resolvedNewPath)
  }

  async isFileUtf8(pathTo: string): Promise<boolean> {
    const fullPath = this.makePath(pathTo)
    // TODO: лучше считывать не весь файл, 1000 байт но кратно utf8 стандарту бит
    const buffer: Buffer = await fs.readFile(fullPath)
    // ещё есть пакет - isutf8
    return isUtf8(buffer)
  }


  private async chown(pathTo: string) {
    if (!cfg.uid && !cfg.gid) {
      // if noting to change - just return
      return
    }
    else if (cfg.uid && cfg.gid) {
      // uid and gid are specified - set both
      return await callPromised(fs.chown, pathTo, cfg.uid, cfg.gid);
    }

    // else load stats to resolve lack of params

    const stat: Stats = await callPromised(fs.lstat, pathTo);

    await callPromised(
      fs.chown,
      pathTo,
      (typeof cfg.uid === 'undefined') ? stat.uid : cfg.uid,
      (typeof cfg.gid === 'undefined') ? stat.gid : cfg.gid,
    );
  }

  private makePath(pathTo: string): string {
    return pathJoin(cfg.rootDir, pathTo)
  }

}
