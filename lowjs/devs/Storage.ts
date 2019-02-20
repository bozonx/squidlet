import * as fs from 'fs';

import StorageDev, {Stats} from 'host/interfaces/dev/StorageDev';
import {callPromised, convertBufferToUint8Array} from '../helpers';


export default class Storage implements StorageDev {
  // TODO: use constant
  private defaultEncode = 'utf8';

  // TODO: сделать конструктор который может заменить кодировку

  appendFile(path: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.appendFile, path, data, this.defaultEncode);
    }
    else {
      return callPromised(fs.appendFile, path, data);
    }
  }

  mkdir(path: string): Promise<void> {
    return callPromised(fs.mkdir, path);
  }

  readdir(path: string): Promise<string[]> {
    return callPromised(fs.readdir, path, this.defaultEncode) as Promise<string[]>;
  }

  readFile(path: string): Promise<string> {
    return callPromised(fs.readFile, path, this.defaultEncode) as Promise<string>;
  }

  async readBinFile(path: string): Promise<Uint8Array> {
    const buffer: Buffer = await callPromised(fs.readFile, path);

    return convertBufferToUint8Array(buffer);
  }

  rmdir(path: string): Promise<void> {
    return callPromised(fs.rmdir, path);
  }

  unlink(path: string): Promise<void> {
    return callPromised(fs.unlink, path);
  }

  writeFile(path: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.writeFile, path, data, this.defaultEncode);
    }
    else {
      return callPromised(fs.writeFile, path, data);
    }
  }

  async stat(path: string): Promise<Stats> {
    const stat = await callPromised(fs.stat, path);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      mtime: stat.mtimeMs,
    };
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }


  // additional

  copyFile(src: string, dest: string): Promise<void> {
    return callPromised(fs.copyFile, src, dest);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return callPromised(fs.rename, oldPath, newPath);
  }

}
