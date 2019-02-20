import * as path from 'path';
import * as fs from 'fs';

import SysDev from '../../host/interfaces/dev/SysDev';
import {callPromised, convertBufferToUint8Array} from '../helpers';


let __storageDir: string = '';
export const DEFAULT_ENCODING = 'utf8';


/**
 * It is a slave's Sys dev
 */
export default class Sys implements SysDev {
  // TODO: review
  static registerStorageDir(storageDir: string) {
    __storageDir = storageDir;
  }

  mkdir(dirName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.mkdir(path.join(__storageDir, dirName), (err: Error) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  readdir(dirName: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(path.join(__storageDir, dirName), (err: Error, dirs: string[]) => {
        if (err) return reject(err);

        resolve(dirs);
      });
    });
  }

  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const filePath = path.join(__storageDir, fileName);
    const fileContent: string = await this.readFileContent(filePath);

    return JSON.parse(fileContent);
  }

  readStringFile(fileName: string): Promise<string> {
    const filePath = path.join(__storageDir, fileName);

    return this.readFileContent(filePath);
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__storageDir, fileName), (err: Error, buffer: Buffer) => {
        if (err) return reject(err);

        resolve(convertBufferToUint8Array(buffer));
      });
    });
  }

  async requireFile(fileName: string): Promise<any> {
    return require(path.join(__storageDir, fileName));
  }

  rmdir(dirName: string): Promise<void> {
    return callPromised(fs.rmdir, path.join(__storageDir, dirName));
  }

  unlink(fileName: string): Promise<void> {
    return callPromised(fs.unlink, path.join(__storageDir, fileName));
  }

  writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
    const filePath = path.join(__storageDir, fileName);

    if (typeof data === 'string') {
      return callPromised(fs.writeFile, filePath, data, {encoding: DEFAULT_ENCODING});
    }
    else {
      // write Uint8Array
      return callPromised(fs.writeFile, filePath, data);
    }
  }

  async exists(fileOrDirName: string): Promise<boolean> {

    // TODO: use fs promises stat

    return fs.existsSync(path.join(__storageDir, fileOrDirName));
  }


  // private readFileContent(filePath: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     fs.readFile(filePath, {encoding: DEFAULT_ENCODING}, (err: Error, fileContent: string) => {
  //       if (err) return reject(err);
  //
  //       resolve(fileContent);
  //     });
  //   });
  // }
  //
}
