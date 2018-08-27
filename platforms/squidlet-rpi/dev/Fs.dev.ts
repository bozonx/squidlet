// See interface in squidlet/host/src/app/interfaces/dev/Fs.dev.ts

import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as util from 'util';

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';
import {Stats} from '../../../host/src/app/interfaces/dev/Fs.dev';


export default class FsDev {
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
    return fsPromises.readFile(path, this.defaultEncode) as Promise<string> ;
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

//
// export default class Factory extends DriverFactoryBase {
//   protected DriverClass: { new (
//       drivers: Drivers,
//       driverProps: DriverProps,
//     ): FsDev } = FsDev;
// }
