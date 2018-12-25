import * as path from 'path';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array, PATH_SEPARATOR, uint8ArrayToText} from '../../../host/src/helpers/helpers';
import {HostFilesSet} from '../../../host/src/app/interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';


let __configSet: HostFilesSet;


export function registerConfigSet (hostConfigSet: HostFilesSet) {
  __configSet = hostConfigSet;
}


function getConfig(configName: string): {[index: string]: any} {
  // TODO: as a string
}

async function getEntityFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Uint8Array {
  // TODO: find
  const absPathToFile: string = __configSet.entitiesSet[pluralType][entityName].files;
  const fileContentBuffer: Buffer = await fsPromises.readFile(absPathToFile);
  const fileContent: Uint8Array = convertBufferToUint8Array(fileContentBuffer);

  return fileContent;
}


export default class SysDev implements Sys {
  mkdir(fileName: string): Promise<void> {
    return Promise.reject(`Method "mkdir" of Sys.dev is not allowed on master`);
  }

  readdir(dirName: string): Promise<string[]> {

    // TODO: remake or remove

    return Promise.reject(`Method "readdir" of Sys.dev is not allowed on master`);
  }

  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'configs') {
      return getConfig(pathSplit[1]);
    }
    else if (pathSplit[0] === 'entities' && pathSplit[3] === 'manifest') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;

      return __configSet.entitiesSet[entityType][pathSplit[2]].manifest;
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readStringFile(fileName: string): Promise<string> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);
      const fileContent: Uint8Array = await getEntityFile(entityType, pathSplit[2], fileName);

      return uint8ArrayToText(fileContent);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);

      return await getEntityFile(entityType, pathSplit[2], fileName);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async requireFile(fileName: string): Promise<any> {

    // TODO: remake

    return require(fileName);
  }

  rmdir(dirName: string): Promise<void> {
    return Promise.reject(`Method "rmdir" of Sys.dev is not allowed on master`);
  }

  async unlink(fileName: string): Promise<void> {
    return Promise.reject(`Method "unlink" of Sys.dev is not allowed on master`);
  }

  async writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
    return Promise.reject(`Method "writeFile" of Sys.dev is not allowed on master`);
  }

  async exists(fileOrDirName: string): Promise<boolean> {

    // TODO: remake or remove

    return Promise.reject(`Method "writeFile" of Sys.dev is not allowed on master`);
  }

}
