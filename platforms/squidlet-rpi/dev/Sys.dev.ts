import * as fs from 'fs';
import {promises as fsPromises} from 'fs';


import Sys from '../../../host/src/app/interfaces/dev/Sys';


export default class SysDev implements Fs {
  // TODO: use constant
  private defaultEncode = 'utf8';

  // TODO: сделать конструктор который может заменить кодировку

  mkdir(path: string): Promise<void> {
    return fsPromises.mkdir(path);
  }

  readdir(path: string): Promise<string[]> {
    return fsPromises.readdir(path, this.defaultEncode) as Promise<string[]>;
  }

  readFile(path: string): Promise<string> {
    return fsPromises.readFile(path, this.defaultEncode) as Promise<string>;
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

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

}
