// See interface in squidlet/host/src/app/interfaces/dev/Storage.dev.ts

import * as fs from 'fs';
import {promisify} from 'es6-promisify';

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


export default class StorageDev {
  mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.mkdirSync as (path: string) => boolean;
      const result: boolean = fn(path);

      if (result) return resolve();

      reject();
    });
  }

  async readdir(path: string): Promise<string[]> {
    return fs.readdirSync(path);
  }

  readFile(path: string): Promise<string> {
    return promisify(fs.readFile)(path, this.defaultEncode);
  }

  rmdir(path: string): Promise<void> {
    return this.unlink(path);
  }

  unlink(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.unlinkSync as (path: string) => boolean;
      const result: boolean = fn(path);

      if (result) return resolve();

      reject();
    });
  }

  writeFile(path: string, data: string | Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.writeFileSync as (path: string, data: string | Uint8Array) => boolean;
      const result: boolean = fn(path, data);

      if (result) return resolve();

      reject();
    });
  }

  copyFile(src: string, dest: string, flags?: number): Promise<void> {
    // TODO: !!! можно создать новый и удалить старый файл
  }

  async exists(path: string): Promise<boolean> {
    // TODO: !!! можно прочитать stat файла и выяснить есть ли он или нет
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    // TODO: можно удалить старый файл и создать новый с тем же содержимым
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
