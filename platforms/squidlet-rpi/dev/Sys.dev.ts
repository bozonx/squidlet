import * as fs from 'fs';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array} from '../../../host/src/helpers/helpers';


const DEFAULT_ENCODING = 'utf8';


// TODO: подставлять корень


export default class SysDev implements Sys {
  mkdir(fileName: string): Promise<void> {
    return fsPromises.mkdir(fileName);
  }

  readdir(dirName: string): Promise<string[]> {
    return fsPromises.readdir(dirName, DEFAULT_ENCODING) as Promise<string[]>;
  }

  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const fileContent: string = await fsPromises.readFile(fileName, DEFAULT_ENCODING);

    return JSON.parse(fileContent);
  }

  readStringFile(fileName: string): Promise<string> {
    return fsPromises.readFile(fileName, DEFAULT_ENCODING) as Promise<string>;
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const buffer: Buffer = await fsPromises.readFile(fileName);

    return convertBufferToUint8Array(buffer);
  }

  async requireFile(fileName: string): Promise<any> {
    return require(fileName);
  }

  rmdir(dirName: string): Promise<void> {
    return fsPromises.rmdir(dirName);
  }

  unlink(fileName: string): Promise<void> {
    return fsPromises.unlink(fileName);
  }

  writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return fsPromises.writeFile(fileName, data, DEFAULT_ENCODING);
    }
    else {
      return fsPromises.writeFile(fileName, data);
    }
  }

  async exists(fileOrDirName: string): Promise<boolean> {
    return fs.existsSync(fileOrDirName);
  }

}
