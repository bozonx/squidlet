import * as path from 'path';
import * as fs from 'fs';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array, PATH_SEPARATOR, uint8ArrayToText} from '../../../host/src/helpers/helpers';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import {EntityClassType} from '../../../host/src/app/entities/EntityManagerBase';


const DEFAULT_ENCODING = 'utf8';
const HOST_DIR = 'host';
const CONFIGS_DIR = 'configs';
const ENTITIES_DIR = 'entities';

// TODO: подставлять корень


/**
 * It is slave Sys.dev
 */
export default class SysDev implements Sys {
  loadHashFile(hashName: string): Promise<{[index: string]: any}> {
  }

  loadConfigFile(configName: string): Promise<{[index: string]: any}> {

    // TODO: где взять root ????

    const storageDir: string = __configSet.config.config.storageDir;
    const filePath = path.join(storageDir, CONFIGS_DIR, `${configName}.json`);

    return this.readJsonObjectFile(filePath);
  }

  async loadEntityManifest(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<{[index: string]: any}> {
    const storageDir: string = __configSet.config.config.storageDir;
    const filePath = path.join(storageDir, ENTITIES_DIR, pluralType, entityName, `manifest.json`);

    return this.readJsonObjectFile(filePath);
  }

  async loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType> {
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
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === 'entities') {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);

      return await getEntityFile(entityType, pathSplit[2], fileName);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async writeHashFile(hasnName: string, content: string): Promise<void> {
  }

  async writeHostFile(fileName: string, content: string): Promise<void> {
  }

  async writeConfig(configName: string, content: string): Promise<void> {
  }

  async writeEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string,
    content: string | Uint8Array
  ): Promise<void> {
  }

  async removeHostFiles(filesList: string[]): Promise<void> {
  }

  async removeEntityFiles(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    filesList: string[]
  ): Promise<void> {
  }


  private async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
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

  private getConfig(configName: string): {[index: string]: any} {
    const config: any = (__configSet as any)[configName];

    if (!config) throw new Error(`Can't find config "${configName}"`);

    return config;
  }


  // mkdir(fileName: string): Promise<void> {
  //   return fsPromises.mkdir(fileName);
  // }
  //
  // readdir(dirName: string): Promise<string[]> {
  //   return fsPromises.readdir(dirName, DEFAULT_ENCODING) as Promise<string[]>;
  // }
  //
  // async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
  //   const fileContent: string = await fsPromises.readFile(fileName, DEFAULT_ENCODING);
  //
  //   return JSON.parse(fileContent);
  // }
  //
  // readStringFile(fileName: string): Promise<string> {
  //   return fsPromises.readFile(fileName, DEFAULT_ENCODING) as Promise<string>;
  // }
  //
  // async readBinFile(fileName: string): Promise<Uint8Array> {
  //   const buffer: Buffer = await fsPromises.readFile(fileName);
  //
  //   return convertBufferToUint8Array(buffer);
  // }
  //
  // async requireFile(fileName: string): Promise<any> {
  //   return require(fileName);
  // }
  //
  // rmdir(dirName: string): Promise<void> {
  //   return fsPromises.rmdir(dirName);
  // }
  //
  // unlink(fileName: string): Promise<void> {
  //   return fsPromises.unlink(fileName);
  // }
  //
  // writeFile(fileName: string, data: string | Uint8Array): Promise<void> {
  //   if (typeof data === 'string') {
  //     return fsPromises.writeFile(fileName, data, DEFAULT_ENCODING);
  //   }
  //   else {
  //     return fsPromises.writeFile(fileName, data);
  //   }
  // }
  //
  // async exists(fileOrDirName: string): Promise<boolean> {
  //   return fs.existsSync(fileOrDirName);
  // }

}
