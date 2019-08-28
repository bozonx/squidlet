import * as fs from 'fs';
import {Stats} from 'fs';

import StorageIo, {StatsSimplified, ConfigParams} from 'system/interfaces/io/StorageIo';
import {callPromised} from 'system/lib/common';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import {ENCODE} from 'system/constants';


let config: ConfigParams | undefined;


/**
 * The same for lowjs and nodejs
 */
export default class Storage implements StorageIo {
  //private readonly os = new Os();

  async configure(configParams: ConfigParams): Promise<void> {
    config = {
      ...config,
      ...configParams,
    };
  }

  async appendFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    const wasExist: boolean = await this.exists(pathTo);

    if (typeof data === 'string') {
      await callPromised(fs.appendFile, pathTo, data, ENCODE);
    }
    else {
      await callPromised(fs.appendFile, pathTo, data);
    }

    if (!wasExist) await this.chown(pathTo);
  }

  async mkdir(pathTo: string): Promise<void> {
    await callPromised(fs.mkdir, pathTo);
    await this.chown(pathTo);
  }

  readdir(pathTo: string): Promise<string[]> {
    return callPromised(fs.readdir, pathTo, ENCODE) as Promise<string[]>;
  }

  readFile(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, ENCODE) as Promise<string>;
  }

  readlink(pathTo: string): Promise<string> {
    return callPromised(fs.readlink, pathTo);
  }

  async readBinFile(pathTo: string): Promise<Uint8Array> {
    const buffer: Buffer = await callPromised(fs.readFile, pathTo);

    return convertBufferToUint8Array(buffer);
  }

  rmdir(pathTo: string): Promise<void> {
    return callPromised(fs.rmdir, pathTo);
  }

  unlink(pathTo: string): Promise<void> {
    return callPromised(fs.unlink, pathTo);
  }

  async writeFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      await callPromised(fs.writeFile, pathTo, data, ENCODE);
    }
    else {
      await callPromised(fs.writeFile, pathTo, data);
    }

    await this.chown(pathTo);
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    const stat = await callPromised(fs.lstat, pathTo);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      symbolicLink: stat.isSymbolicLink(),
      mtime: stat.mtime.getTime(),
    };
  }

  async exists(pathTo: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      fs.access(pathTo, fs.constants.F_OK, (err) => {
        if (err) return resolve(false);

        resolve(true);
      });
    });
  }


  ////// additional

  async copyFile(src: string, dest: string): Promise<void> {
    await callPromised(fs.copyFile, src, dest);
    await this.chown(dest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await callPromised(fs.rename, oldPath, newPath);
    await this.chown(newPath);
  }


  private async chown(pathTo: string) {
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

}
