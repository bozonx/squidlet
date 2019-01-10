import * as fs from 'fs';
import {promises as fsPromises} from 'fs';


import Storage, {Stats} from '../../../host/src/app/interfaces/dev/Storage';
import {convertBufferToUint8Array} from '../helpers';


export default class StorageDev implements Storage {
  // TODO: use constant
  private defaultEncode = 'utf8';

  // TODO: сделать конструктор который может заменить кодировку

  appendFile(path: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return fsPromises.appendFile(path, data, this.defaultEncode);
    }
    else {
      return fsPromises.appendFile(path, data);
    }
  }

  mkdir(path: string): Promise<void> {
    return fsPromises.mkdir(path);
  }

  readdir(path: string): Promise<string[]> {
    return fsPromises.readdir(path, this.defaultEncode) as Promise<string[]>;
  }

  readFile(path: string): Promise<string> {
    return fsPromises.readFile(path, this.defaultEncode) as Promise<string>;
  }

  async readBinFile(path: string): Promise<Uint8Array> {
    const buffer: Buffer = await fsPromises.readFile(path);

    return convertBufferToUint8Array(buffer);
  }

  rmdir(path: string): Promise<void> {
    return fsPromises.rmdir(path);
  }

  unlink(path: string): Promise<void> {
    return fsPromises.unlink(path);
  }

  writeFile(path: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return fsPromises.writeFile(path, data, this.defaultEncode);
    }
    else {
      return fsPromises.writeFile(path, data);
    }
  }

  async stat(path: string): Promise<Stats> {
    const stat = await fsPromises.stat(path);

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
    return fsPromises.copyFile(src, dest);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return fsPromises.rename(oldPath, newPath);
  }

}
