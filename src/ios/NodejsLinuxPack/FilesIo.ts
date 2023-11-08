import path from 'node:path'
import fs from 'node:fs/promises'
import {exec} from 'node:child_process'
import {promisify} from 'node:util'
import type {Stats} from 'node:fs'
import {
  pathJoin,
  PATH_SEP,
  trimCharEnd,
  DEFAULT_ENCODE,
  convertBufferToUint8Array,
  trimCharStart
} from 'squidlet-lib'
import type FilesIoType from '../../types/io/FilesIoType.js'
import type {FilesIoConfig, StatsSimplified} from '../../types/io/FilesIoType.js'
import {IoBase} from '../../system/Io/IoBase.js'
import type {IoIndex} from '../../types/types.js'
import type {IoContext} from '../../system/Io/IoContext.js'
import {ROOT_DIRS} from '../../types/contstants.js'

export const execPromise = promisify(exec)


function prepareSubPath(subDirOfRoot: string, rootDir?: string, envPath?: string) {
  if (rootDir) {
    return pathJoin(rootDir, subDirOfRoot)
  }

  if (!envPath) {
    throw new Error(`Dir "${subDirOfRoot}" haven't set by env`)
  }

  // TODO: а разве path.resolve не уберёт последний слэш???
  return trimCharEnd(path.resolve(envPath), PATH_SEP)
}

export const FilesIoIndex: IoIndex = (ctx: IoContext) => {
  const rootDir = process.env.ROOT_DIR
    // TODO: а разве path.resolve не уберёт последний слэш???
    && trimCharEnd(path.resolve(process.env.ROOT_DIR), PATH_SEP)
    || ''
  const cfg: FilesIoConfig = {

    //rootDir: trimCharEnd(path.resolve(process.env.FILES_ROOT_DIR|| '') , PATH_SEP),
    uid: (process.env.FILES_UID) ? Number(process.env.FILES_UID) : undefined,
    gid: (process.env.FILES_GID) ? Number(process.env.FILES_GID) : undefined,

    dirs: {
      cfg: prepareSubPath(ROOT_DIRS.cfg, rootDir, process.env.CONFIGS_DIR),
      appFiles: prepareSubPath(ROOT_DIRS.appFiles, rootDir, process.env.APP_FILES_DIR),
      appDataLocal: prepareSubPath(ROOT_DIRS.appDataLocal, rootDir, process.env.APP_DATA_LOCAL_DIR),
      appDataSynced: prepareSubPath(ROOT_DIRS.appDataSynced, rootDir, process.env.APP_DATA_SYNCED_DIR),
      db: prepareSubPath(ROOT_DIRS.db, rootDir, process.env.DB_DIR),
      cache: prepareSubPath(ROOT_DIRS.cache, rootDir, process.env.CACHE_DIR),
      log: prepareSubPath(ROOT_DIRS.log, rootDir, process.env.LOG_DIR),
      tmp: prepareSubPath(ROOT_DIRS.tmp, rootDir, process.env.TMP_DIR),
      userData: prepareSubPath(ROOT_DIRS.userData, rootDir, process.env.USER_DATA_DIR),
    },
  }

  //if (!cfg.rootDir) throw new Error(`FilesIo: no rootDir in config`)

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
    let wasExist = true

    try {
      await fs.lstat(pathTo)
    }
    catch (e) {
      wasExist = false
    }

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

    return fs.readFile(fullPath, DEFAULT_ENCODE)
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
    const stat: Stats = await fs.lstat(fullPath)

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

  async rmdirR(pathTo: string): Promise<void> {
    const fullPath = this.makePath(pathTo)

    const res = await execPromise(`rm -R "${fullPath}"`)

    if (res.stderr) {
      throw new Error(`Can't remove a directory recursively: ${res.stderr}`)
    }

    return
  }

  async mkDirP(pathTo: string): Promise<void> {
    const fullPath = this.makePath(pathTo)
    const res = await execPromise(`mkdir -p "${fullPath}"`)

    if (res.stderr) {
      throw new Error(`Can't mkDirP: ${res.stderr}`)
    }

    return
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
    const stat: Stats = await fs.lstat(pathTo)

    await fs.chown(
      pathTo,
      (!this.cfg.uid) ? stat.uid : this.cfg.uid,
      (!this.cfg.gid) ? stat.gid : this.cfg.gid,
    )
  }

  private makePath(pathTo: string): string {
    if (pathTo.indexOf('/') !== 0) {
      throw new Error(`Path has to be started from "/": ${pathTo}`)
    }

    const pathSplat: string[] = trimCharStart(pathTo, PATH_SEP).split(PATH_SEP)

    if (!Object.keys(ROOT_DIRS).includes(pathSplat[0])) {
      // means external dir
      return pathTo
    }
    // put some system dir
    const resolvedAbsDir: string | undefined = this.cfg.dirs[pathSplat[0] as keyof FilesIoConfig['dirs']]

    if (resolvedAbsDir) {
      pathSplat[0] = resolvedAbsDir

      return pathSplat.join('/')
    }
    // means full absolute path
    return pathTo
  }

}
