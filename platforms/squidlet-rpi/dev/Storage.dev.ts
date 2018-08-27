// See interface in squidlet/host/src/app/interfaces/dev/Storage.dev.ts

import {promises as fsPromises} from 'fs';
import * as util from 'util';

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


export default class StorageDev {
  readFile(path: string, options?: object | string): Promise<string> {
    return util.promisify(fs.readFile)(path, options) as Promise<string>;
  }

  readdir(path: string, options?: object | string): Promise<string[]> {
    return util.promisify(fs.readdir)(path, options) as Promise<string[]>;
  }

  copyFile(src: string, dest: string, flags?: number): Promise<void> {
    return util.promisify(fs.copyFile)(src, dest, flags);
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return util.promisify(fs.rename)(oldPath, newPath);
  }

  unlink(path: string): Promise<void> {
    return util.promisify(fs.unlink)(path);
  }

}

//
// export default class Factory extends DriverFactoryBase {
//   protected DriverClass: { new (
//       drivers: Drivers,
//       driverParams: {[index: string]: any},
//     ): StorageDev } = StorageDev;
// }
