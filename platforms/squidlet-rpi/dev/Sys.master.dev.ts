import * as path from 'path';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array, PATH_SEPARATOR, uint8ArrayToText} from '../../../host/src/helpers/helpers';
import {HostFilesSet} from '../../../host/src/app/interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import {EntityClassType} from '../../../host/src/app/entities/EntityManagerBase';


let __configSet: HostFilesSet;
// TODO: get from slave Sys.dev
const ENTITIES_DIR = 'entities';


export function registerConfigSet (hostConfigSet: HostFilesSet) {
  __configSet = hostConfigSet;
}


async function getEntityFile(
  pluralType: ManifestsTypePluralName,
  entityName: string,
  fileName: string
): Promise<Uint8Array> {
  let foundAbsPath: string | undefined;
  const regex = new RegExp(`${fileName}$`);

  for (let absPath of __configSet.entitiesSet[pluralType][entityName].files) {
    if (absPath.match(regex)) {
      foundAbsPath = absPath;

      break;
    }
  }

  if (!foundAbsPath) throw new Error(`Can't find an entity file "${pluralType}/${entityName}/${fileName}"`);

  const fileContentBuffer: Buffer = await fsPromises.readFile(foundAbsPath);
  const fileContent: Uint8Array = convertBufferToUint8Array(fileContentBuffer);

  return fileContent;
}




export default class SysDev implements Sys {
  loadHashFile(hashName: string): Promise<{[index: string]: any}> {
    return Promise.reject(`Method "loadHashFile" of Sys.dev is not allowed on master`);
  }

  async loadConfigFile(configName: string): Promise<{[index: string]: any}> {
    return this.getConfig(configName);
  }

  async loadEntityManifest(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<{[index: string]: any}> {
    return __configSet.entitiesSet[pluralType][entityName].manifest;
  }

  async loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType> {

    // TODO: require real ts file


    const pathSplit = fileName.split(PATH_SEPARATOR);

    // TODO: !!!! нужен абсолютный путь - взять из entity set

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const absFileName =
      //const fileName: string = pathSplit.slice(3).join(path.sep);

      return require();
    }

    throw new Error(`Sys.dev "requireFile": Unsupported system dir "${fileName}" on master`);
  }

  async loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {

    // TODO: load real file

    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);
      const fileContent: Uint8Array = await getEntityFile(entityType, pathSplit[2], fileName);

      return uint8ArrayToText(fileContent);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {

    // TODO: load real file

    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);

      return await getEntityFile(entityType, pathSplit[2], fileName);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async writeHashFile(hasnName: string, content: string): Promise<void> {
    return Promise.reject(`Method "writeHashFile" of Sys.dev is not allowed on master`);
  }

  async writeHostFile(fileName: string, content: string): Promise<void> {
    return Promise.reject(`Method "writeHostFile" of Sys.dev is not allowed on master`);
  }

  async writeConfig(configName: string, content: string): Promise<void> {
    return Promise.reject(`Method "writeConfig" of Sys.dev is not allowed on master`);
  }

  async writeEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string,
    content: string | Uint8Array
  ): Promise<void> {
    return Promise.reject(`Method "writeEntityFile" of Sys.dev is not allowed on master`);
  }

  async removeHostFiles(filesList: string[]): Promise<void> {
    return Promise.reject(`Method "removeHostFiles" of Sys.dev is not allowed on master`);
  }

  async removeEntityFiles(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    filesList: string[]
  ): Promise<void> {
    return Promise.reject(`Method "removeEntityFiles" of Sys.dev is not allowed on master`);
  }


  private getConfig(configName: string): {[index: string]: any} {
    const config: any = (__configSet as any)[configName];

    if (!config) throw new Error(`Can't find config "${configName}"`);

    return config;
  }








  /////////// TODO: remake

  // mkdir(fileName: string): Promise<void> {
  //   return Promise.reject(`Method "mkdir" of Sys.dev is not allowed on master`);
  // }
  //
  // readdir(dirName: string): Promise<string[]> {
  //
  //   // TODO: remake or remove
  //
  //   return Promise.reject(`Method "readdir" of Sys.dev is not allowed on master`);
  // }

  // async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
  //   const pathSplit = fileName.split(PATH_SEPARATOR);
  //
  //   if (pathSplit[0] === 'configs') {
  //     return getConfig(pathSplit[1]);
  //   }
  //   else if (pathSplit[0] === 'entities' && pathSplit[3] === 'manifest') {
  //     const entityType = pathSplit[1] as ManifestsTypePluralName;
  //
  //     return __configSet.entitiesSet[entityType][pathSplit[2]].manifest;
  //   }
  //
  //   throw new Error(`Unsupported system dir "${fileName}" on master`);
  // }

  // async readStringFile(fileName: string): Promise<string> {
  //   // const pathSplit = fileName.split(PATH_SEPARATOR);
  //   //
  //   // if (pathSplit[0] === 'entities') {
  //   //   const entityType = pathSplit[1] as ManifestsTypePluralName;
  //   //   const fileName: string = pathSplit.slice(3).join(path.sep);
  //   //   const fileContent: Uint8Array = await getEntityFile(entityType, pathSplit[2], fileName);
  //   //
  //   //   return uint8ArrayToText(fileContent);
  //   // }
  //   //
  //   // throw new Error(`Unsupported system dir "${fileName}" on master`);
  // }

  // async readBinFile(fileName: string): Promise<Uint8Array> {
  //   const pathSplit = fileName.split(PATH_SEPARATOR);
  //
  //   if (pathSplit[0] === 'entities') {
  //     const entityType = pathSplit[1] as ManifestsTypePluralName;
  //     const fileName: string = pathSplit.slice(3).join(path.sep);
  //
  //     return await getEntityFile(entityType, pathSplit[2], fileName);
  //   }
  //
  //   throw new Error(`Unsupported system dir "${fileName}" on master`);
  // }

  // async requireFile(fileName: string): Promise<any> {
  //   const pathSplit = fileName.split(PATH_SEPARATOR);
  //
  //   // TODO: !!!! нужен абсолютный путь - взять из entity set
  //
  //   if (pathSplit[0] === 'entities') {
  //     const entityType = pathSplit[1] as ManifestsTypePluralName;
  //     const absFileName =
  //     //const fileName: string = pathSplit.slice(3).join(path.sep);
  //
  //     return require();
  //   }
  //
  //   throw new Error(`Sys.dev "requireFile": Unsupported system dir "${fileName}" on master`);
  // }

  //
  // rmdir(dirName: string): Promise<void> {
  //   return Promise.reject(`Method "rmdir" of Sys.dev is not allowed on master`);
  // }
  //
  // async unlink(fileName: string): Promise<void> {
  //   return Promise.reject(`Method "unlink" of Sys.dev is not allowed on master`);
  // }
  //
  // async writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
  //   return Promise.reject(`Method "writeFile" of Sys.dev is not allowed on master`);
  // }
  //
  // async exists(fileOrDirName: string): Promise<boolean> {
  //
  //   // TODO: remake or remove
  //
  //   return Promise.reject(`Method "writeFile" of Sys.dev is not allowed on master`);
  // }

}
