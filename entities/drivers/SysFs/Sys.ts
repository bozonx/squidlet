import * as path from 'path';
import * as fs from 'fs';

import SysDev from 'host/interfaces/dev/SysDev';
import {convertBufferToUint8Array, callPromised} from '../../../nodejs/helpers';


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
    return callPromised(fs.mkdir, path.join(__storageDir, dirName));
  }

  readdir(dirName: string): Promise<string[]> {
    return callPromised(fs.readdir, path.join(__storageDir, dirName));
  }

  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const filePath = path.join(__storageDir, fileName);
    const fileContent: string = await callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});

    return JSON.parse(fileContent);
  }

  readStringFile(fileName: string): Promise<string> {
    const filePath = path.join(__storageDir, fileName);

    return callPromised(fs.readFile, filePath, {encoding: DEFAULT_ENCODING});
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const buffer: Buffer = await callPromised(fs.readFile, path.join(__storageDir, fileName));

    return convertBufferToUint8Array(buffer);
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

    // TODO: use fs stat

    return fs.existsSync(path.join(__storageDir, fileOrDirName));
  }

}
