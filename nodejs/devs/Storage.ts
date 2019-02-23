import * as fs from 'fs';

import StorageDev, {Stats} from 'host/interfaces/dev/StorageDev';
import {callPromised} from 'host/helpers/helpers';

import {convertBufferToUint8Array} from '../helpers';


const DEFAULT_ENCODE = 'utf8';


export default class Storage implements StorageDev {
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
    const stat = await callPromised(fs.stat, pathTo);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      mtime: stat.mtimeMs,
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
