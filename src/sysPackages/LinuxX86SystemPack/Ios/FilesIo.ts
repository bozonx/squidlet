import fs from 'node:fs/promises'
import {Stats, existsSync, lstatSync} from 'node:fs'
import {pathJoin, PATH_SEP, trimCharEnd, DEFAULT_ENCODE, convertBufferToUint8Array} from 'squidlet-lib'
import FilesIoType, {FilesIoConfig, StatsSimplified} from '../../../types/io/FilesIoType.js'
import {IoBase} from '../../../system/Io/IoBase.js'
import {IoIndex} from '../../../types/types.js'
import {IoContext} from '../../../system/Io/IoContext.js'


export const FilesIoIndex: IoIndex = (ctx: IoContext) => {
  const cfg: FilesIoConfig = {
    rootDir: trimCharEnd(process.env.FILES_ROOT_DIR || '', PATH_SEP),
    uid: (process.env.FILES_UID) ? Number(process.env.FILES_UID) : undefined,
    gid: (process.env.FILES_GID) ? Number(process.env.FILES_GID) : undefined,
  }

  if (!cfg.rootDir) throw new Error(`FilesIo: no rootDir in config`)

  return new FilesIo(ctx, cfg)
}


export class FilesIo extends IoBase implements FilesIoType {
  private readonly cfg: FilesIoConfig

  constructor(ctx: IoContext, cfg: FilesIoConfig) {
    super(ctx)

    this.cfg = cfg
  }

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

  async copyFiles(files: [string, string][]): Promise<void> {
    for (const item of files) {
      const dest = this.makePath(item[1])
      const src = this.makePath(item[0])

      await fs.copyFile(src, dest)
      await  this.chown(dest)
    }
  }

  async renameFiles(files: [string, string][]): Promise<void> {
    for (const item of files) {
      const oldPath = this.makePath(item[0])
      const newPath = this.makePath(item[1])

      await fs.rename(oldPath, newPath)
      await this.chown(newPath)
    }
  }


  private async chown(pathTo: string) {
    if (!this.cfg.uid && !this.cfg.gid) {
      // if noting to change - just return
      return
    }
    else if (this.cfg.uid && this.cfg.gid) {
      // uid and gid are specified - set both
      return await fs.chown(pathTo, this.cfg.uid, this.cfg.gid)
    }
    // else load stats to resolve lack of params
    const stat: Stats = lstatSync(pathTo)

    await fs.chown(
      pathTo,
      (!this.cfg.uid) ? stat.uid : this.cfg.uid,
      (!this.cfg.gid) ? stat.gid : this.cfg.gid,
    )
  }

  private makePath(pathTo: string): string {
    return pathJoin(this.cfg.rootDir, pathTo)
  }

}
