import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array} from '../../../host/src/helpers/helpers';
import {HostFilesSet} from '../../../host/src/app/interfaces/HostFilesSet';


const DEFAULT_ENCODING = 'utf8';
let configSet: HostFilesSet;

// TODO: подставлять корень

export function registerConfigSet (hostConfigSet: HostFilesSet) {
  configSet = hostConfigSet;
}


function getConfig(configName: string): {[index: string]: any} {
  // TODO: as a string
}

function getEntityFile(configName: string): any {

}


export default class SysDev implements Sys {
  mkdir(fileName: string): Promise<void> {
    //return fsPromises.mkdir(fileName);
    return Promise.resolve();
  }

  readdir(dirName: string): Promise<string[]> {
    //return fsPromises.readdir(dirName, DEFAULT_ENCODING) as Promise<string[]>;
    return Promise.resolve([]);
  }

  readFile(fileName: string): Promise<string> {
    //return fsPromises.readFile(fileName, DEFAULT_ENCODING) as Promise<string>;

    const pathSplit = fileName.split('.');

    if (pathSplit[0] === 'configs') {
      return getConfig(pathSplit[1]);
    }
    else if (pathSplit[0] === 'entities') {

    }
    else {
      throw new Error(`Unsupported system dir "${pathSplit[0]}" on master`);
    }

  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const buffer: Buffer = await fsPromises.readFile(fileName);

    return convertBufferToUint8Array(buffer);
  }

  async requireFile(fileName: string): Promise<any> {
    return require(fileName);
  }

  rmdir(dirName: string): Promise<void> {
    //return fsPromises.rmdir(dirName);
    return Promise.resolve();
  }

  unlink(fileName: string): Promise<void> {
    //return fsPromises.unlink(fileName);
    return Promise.resolve();
  }

  writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
    // if (typeof data === 'string') {
    //   return fsPromises.writeFile(fileName, data, DEFAULT_ENCODING);
    // }
    // else {
    //   return fsPromises.writeFile(fileName, data);
    // }
    return Promise.resolve();
  }

  async exists(fileOrDirName: string): Promise<boolean> {
    //return fs.existsSync(fileOrDirName);
    return Promise.resolve(true);
  }

}
