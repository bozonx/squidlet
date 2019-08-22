import * as fs from 'fs';

import StorageIo, {Stats, ConfigParams} from 'system/interfaces/io/StorageIo';
import {callPromised} from 'system/lib/helpers';
import {convertBufferToUint8Array} from 'system/lib/buffer';
import {ENCODE} from 'system/constants';


let config: ConfigParams | undefined;


/**
 * The same for lowjs and nodejs
 */
export default class Storage implements StorageIo {
  async configure(configParams: ConfigParams): Promise<void> {
    config = {
      ...config,
      ...configParams,
    };
  }

  appendFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.appendFile, pathTo, data, ENCODE);
    }
    else {
      return callPromised(fs.appendFile, pathTo, data);
    }
  }

  mkdir(pathTo: string): Promise<void> {
    return callPromised(fs.mkdir, pathTo);
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

  async stat(pathTo: string): Promise<Stats> {
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

  copyFile(src: string, dest: string): Promise<void> {
    return callPromised(fs.copyFile, src, dest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await callPromised(fs.rename, oldPath, newPath);
    await this.chown(newPath);
  }


  private async chown(pathTo: string) {
    if (!config) return;

    return callPromised(fs.chown, pathTo, config.uid, config.gid);
  }

}
