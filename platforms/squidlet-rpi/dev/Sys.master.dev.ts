import * as path from 'path';
import {promises as fsPromises} from 'fs';

import Sys from '../../../host/src/app/interfaces/dev/Sys';
import {convertBufferToUint8Array, PATH_SEPARATOR, uint8ArrayToText} from '../../../host/src/helpers/helpers';
import {SrcHostFilesSet} from '../../../host/src/app/interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import {CONFIGS_DIR, ENTITIES_DIR} from '../../../host/src/drivers/Sys/Sys.driver';
import initializationConfig from '../../../host/src/app/config/initializationConfig';
import {DEFAULT_ENCODING} from './Sys.dev';


let __configSet: SrcHostFilesSet;
const initCfg = initializationConfig();


export default class SysDev implements Sys {
  static registerConfigSet (hostConfigSet: SrcHostFilesSet) {
    __configSet = hostConfigSet;
  }


  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    // config - read from memory
    if (pathSplit[0] === CONFIGS_DIR) {
      return this.getConfig(pathSplit[1]);
    }
    // manifest - read from memory
    else if (pathSplit[0] === ENTITIES_DIR && pathSplit[3] === initCfg.fileNames.manifest) {
      const entityType = pathSplit[1] as ManifestsTypePluralName;

      return __configSet.entitiesSet[entityType][pathSplit[2]].manifest;
    }
    // other entity file - read from disk
    else if (pathSplit[0] === ENTITIES_DIR) {
      // load entity file
      const fileContent: string = await this.readStringFile(fileName);

      return JSON.parse(fileContent);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readStringFile(fileName: string): Promise<string> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === ENTITIES_DIR) {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);
      const entitySrcDir: string = __configSet.entitiesSet[entityType][pathSplit[1]].srcDir;
      const absFileName = path.join(entitySrcDir, fileName);

      return fsPromises.readFile(absFileName, {encoding: DEFAULT_ENCODING});
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === ENTITIES_DIR) {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const fileName: string = pathSplit.slice(3).join(path.sep);
      const entitySrcDir: string = __configSet.entitiesSet[entityType][pathSplit[1]].srcDir;
      const absFileName = path.join(entitySrcDir, fileName);
      const fileContentBuffer: Buffer = await fsPromises.readFile(absFileName);

      return convertBufferToUint8Array(fileContentBuffer);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async requireFile(fileName: string): Promise<any> {
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


  private getConfig(configName: string): {[index: string]: any} {
    const config: any = (__configSet as any)[configName];

    if (!config) throw new Error(`Can't find config "${configName}"`);

    return config;
  }

  // private async getEntityFile(
  //   pluralType: ManifestsTypePluralName,
  //   entityName: string,
  //   fileName: string
  // ): Promise<Uint8Array> {
  //
  //   // TODO: remake
  //
  //   let foundAbsPath: string | undefined;
  //   const regex = new RegExp(`${fileName}$`);
  //
  //   for (let absPath of __configSet.entitiesSet[pluralType][entityName].files) {
  //     if (absPath.match(regex)) {
  //       foundAbsPath = absPath;
  //
  //       break;
  //     }
  //   }
  //
  //   if (!foundAbsPath) throw new Error(`Can't find an entity file "${pluralType}/${entityName}/${fileName}"`);
  //
  //   const fileContentBuffer: Buffer = await fsPromises.readFile(foundAbsPath);
  //   const fileContent: Uint8Array = convertBufferToUint8Array(fileContentBuffer);
  //
  //   return fileContent;
  // }


  mkdir(fileName: string): Promise<void> {
    return Promise.reject(`Method "mkdir" of Sys.dev is not allowed on master`);
  }

  readdir(dirName: string): Promise<string[]> {
    return Promise.reject(`Method "readdir" of Sys.dev is not allowed on master`);
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
    return Promise.reject(`Method "writeFile" of Sys.dev is not allowed on master`);
  }

}
