import fs from 'node:fs/promises'
import {Stats} from 'node:fs'
import {pathJoin, PATH_SEP, DEFAULT_ENCODE, convertBufferToUint8Array} from 'squidlet-lib'
import FilesIo from '../../../types/io/FilesIo.js'

import {StatsSimplified, ConfigParams} from '../../../../../../squidlet/__old/system/interfaces/io/FilesIo';
import {trimCharEnd} from '../squidlet-lib/src/strings';


let config: ConfigParams | undefined;


export default class Files implements FilesIo {
  //private readonly os = new Os();

  async configure(configParams: ConfigParams): Promise<void> {
    // TODO: review
    // remove trailing slash if set
    const resolvedWorkDir: string | undefined = (configParams.workDir)
      ? trimCharEnd(configParams.workDir, PATH_SEP)
      : undefined;

    config = {
      ...config,
      ...configParams,
    };

    if (resolvedWorkDir) config.workDir = resolvedWorkDir;
  }

  async appendFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    // TODO: review
    const fullPath = this.makePath(pathTo)
    const wasExist: boolean = await this.exists(pathTo);

    if (typeof data === 'string') {
      await callPromised(fs.appendFile, fullPath, data, ENCODE);
    }
    else {
      await callPromised(fs.appendFile, fullPath, data);
    }

    if (!wasExist) await this.chown(fullPath);
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

    const buff = await fs.readFile(fullPath, DEFAULT_ENCODE)

    return buff.toString(DEFAULT_ENCODE)
  }

  readlink(pathTo: string): Promise<string> {
    const fullPath = this.makePath(pathTo)

    return fs.readlink(fullPath)
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    const fullPath = this.makePath(pathTo);

    const buffer: Buffer = await fs.readFile(fullPath)

    return convertBufferToUint8Array(buffer)
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
    // TODO: review
    const fullPath = this.makePath(pathTo);
    const stat = await callPromised(fs.lstat, fullPath);

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


  private async chown(pathTo: string) {

    // TODO: а оно надо???

    if (!config) return;

    if (typeof config.uid === 'undefined' && typeof config.gid === 'undefined') {
      // noting to change - just return
      return;
    }
    else if (typeof config.uid !== 'undefined' && typeof config.gid !== 'undefined') {
      // uid and gid are specified - set both
      return await callPromised(fs.chown, pathTo, config.uid, config.gid);
    }

    // else load stats to resolve lack of params

    const stat: Stats = await callPromised(fs.lstat, pathTo);

    await callPromised(
      fs.chown,
      pathTo,
      (typeof config.uid === 'undefined') ? stat.uid : config.uid,
      (typeof config.gid === 'undefined') ? stat.gid : config.gid,
    );
  }

  private makePath(pathTo: string): string {
    if (!config || !config.workDir) throw new Error(`Storage IO: workDir han't been set`);

    return pathJoin(config.workDir, pathTo)
  }

}
