// See interface in squidlet/host/src/app/interfaces/dev/Storage.dev.ts

import * as fs from 'fs';
import {promisify} from 'es6-promisify';

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


export default class StorageDev {
  private defaultEncode = 'utf8';

  // TODO: сделать конструктор который может заменить кодировку

  mkdir(path: string): Promise<void> {
    return fsPromises.mkdir(path);
  }

  rmdir(path: string): Promise<void> {
    return fsPromises.rmdir(path);
  }

  readFile(path: string): Promise<string> {
    // TODO: нужно ли устанавливать кодировку ? - если не установить то вернется Buffer
    return fsPromises.readFile(path, this.defaultEncode) as Promise<string> ;
  }

  readdir(path: string, options?: object | string): Promise<string[] | Buffer[]> {
    return fsPromises.readdir(path, options);
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

  unlink(path: string): Promise<void> {
    return fsPromises.unlink(path);
  }

  // stat(path: string): Promise<Stats> {
  //   return fsPromises.stat(path);
  // }

  writeFile(path: string, data: string | Buffer | Uint8Array, options: object | string): Promise<void> {
    return fsPromises.writeFile(path, data, options);
  }



}

//
// export default class Factory extends DriverFactoryBase {
//   protected DriverClass: { new (
//       drivers: Drivers,
//       driverParams: {[index: string]: any},
//     ): StorageDev } = StorageDev;
// }
