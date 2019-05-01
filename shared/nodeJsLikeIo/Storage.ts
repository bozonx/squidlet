import * as fs from 'fs';

import StorageIo, {Stats} from 'system/interfaces/io/StorageIo';
import {callPromised} from 'system/helpers/helpers';

const {convertBufferToUint8Array} = require('./helpers');


const DEFAULT_ENCODE = 'utf8';


/**
 * The same for lowjs and nodejs
 */
export default class Storage implements StorageIo {
  appendFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.appendFile, pathTo, data, DEFAULT_ENCODE);
    }
    else {
      return callPromised(fs.appendFile, pathTo, data);
    }
  }

  mkdir(pathTo: string): Promise<void> {
    return callPromised(fs.mkdir, pathTo);
  }

  readdir(pathTo: string): Promise<string[]> {
    return callPromised(fs.readdir, pathTo, DEFAULT_ENCODE) as Promise<string[]>;
  }

  readFile(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, DEFAULT_ENCODE) as Promise<string>;
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

  writeFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.writeFile, pathTo, data, DEFAULT_ENCODE);
    }
    else {
      return callPromised(fs.writeFile, pathTo, data);
    }
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

  rename(oldPath: string, newPath: string): Promise<void> {
    return callPromised(fs.rename, oldPath, newPath);
  }

}
