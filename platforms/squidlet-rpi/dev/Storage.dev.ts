// See interface in squidlet/host/src/app/interfaces/dev/Storage.dev.ts

import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as util from 'util';

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


export default class StorageDev {
  private defaultEncode = 'utf8';

  // TODO: сделать конструктор который может заменить кодировку


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




  copyFile(src: string, dest: string, flags?: number): Promise<void> {
    return fsPromises.copyFile(src, dest, flags);
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return fsPromises.rename(oldPath, newPath);
  }




  // TODO: add stat
  // stat(path: string): Promise<Stats> {
  //   return fsPromises.stat(path);
  // }

}

//
// export default class Factory extends DriverFactoryBase {
//   protected DriverClass: { new (
//       drivers: Drivers,
//       driverParams: {[index: string]: any},
//     ): StorageDev } = StorageDev;
// }
