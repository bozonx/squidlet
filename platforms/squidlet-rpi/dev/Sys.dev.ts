import * as path from 'path';
import * as fs from 'fs';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array} from '../helpers';


let __storageDir: string = '';
export const DEFAULT_ENCODING = 'utf8';


/**
 * It is a slave's Sys.dev
 */
export default class SysDev implements Sys {
  static registerStorageDir(storageDir: string) {
    __storageDir = storageDir;
  }

  mkdir(dirName: string): Promise<void> {
    return fsPromises.mkdir(path.join(__storageDir, dirName));
  }

  readdir(dirName: string): Promise<string[]> {
    return fsPromises.readdir(path.join(__storageDir, dirName)) as Promise<string[]>;
  }

  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const filePath = path.join(__storageDir, fileName);
    const fileContent: string = await fsPromises.readFile(filePath, {encoding: DEFAULT_ENCODING});

    return JSON.parse(fileContent);
  }

  readStringFile(fileName: string): Promise<string> {
    const filePath = path.join(__storageDir, fileName);

    return fsPromises.readFile(filePath, {encoding: DEFAULT_ENCODING}) as Promise<string>;
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const buffer: Buffer = await fsPromises.readFile(path.join(__storageDir, fileName));

    return convertBufferToUint8Array(buffer);
  }

  async requireFile(fileName: string): Promise<any> {
    return require(path.join(__storageDir, fileName));
  }

  rmdir(dirName: string): Promise<void> {
    return fsPromises.rmdir(path.join(__storageDir, dirName));
  }

  unlink(fileName: string): Promise<void> {
    return fsPromises.unlink(path.join(__storageDir, fileName));
  }

  writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
    const filePath = path.join(__storageDir, fileName);

    if (typeof data === 'string') {
      return fsPromises.writeFile(filePath, data, {encoding: DEFAULT_ENCODING});
    }
    else {
      // write Uint8Array
      return fsPromises.writeFile(filePath, data);
    }
  }

  async exists(fileOrDirName: string): Promise<boolean> {

    // TODO: use fs promises stat

    return fs.existsSync(path.join(__storageDir, fileOrDirName));
  }

}
