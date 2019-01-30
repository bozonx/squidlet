import * as path from 'path';
import {promises as fsPromises} from 'fs';

import Sys from '../../../squidlet-core/core/interfaces/dev/Sys';
import {PATH_SEPARATOR} from '../../../squidlet-core/core/helpers/helpers';
import {convertBufferToUint8Array} from '../helpers';
import {SrcHostFilesSet} from '../../../squidlet-core/core/interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../squidlet-core/core/interfaces/ManifestTypes';
import initializationConfig from '../../../squidlet-core/core/config/initializationConfig';
import {DEFAULT_ENCODING} from './Sys.dev';
import {trimEnd} from '../../../squidlet-core/core/helpers/lodashLike';
import systemConfig from '../../../squidlet-core/core/config/systemConfig';


let __configSet: SrcHostFilesSet;
const initCfg = initializationConfig();


export default class SysDev implements Sys {
  static registerConfigSet (hostConfigSet: SrcHostFilesSet) {
    __configSet = hostConfigSet;
  }


  async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    // config - read from memory
    if (pathSplit[0] === systemConfig.rootDirs.configs) {
      return this.getConfig(pathSplit[1]);
    }
    // manifest - read from memory
    else if (pathSplit[0] === systemConfig.rootDirs.entities && pathSplit[3] === initCfg.fileNames.manifest) {
      const entityType = pathSplit[1] as ManifestsTypePluralName;

      return __configSet.entitiesSet[entityType][pathSplit[2]].manifest;
    }
    // other entity file - read from disk
    else if (pathSplit[0] === systemConfig.rootDirs.entities) {
      // load entity file

      const fileContent: string = await this.readStringFile(fileName);

      return JSON.parse(fileContent);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readStringFile(fileName: string): Promise<string> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === systemConfig.rootDirs.entities) {
      const fileAbsPath = this.getEntityFileAbsPath(fileName);

      return fsPromises.readFile(fileAbsPath, {encoding: DEFAULT_ENCODING});
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async readBinFile(fileName: string): Promise<Uint8Array> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === systemConfig.rootDirs.entities) {
      const fileAbsPath = this.getEntityFileAbsPath(fileName);
      const fileContentBuffer: Buffer = await fsPromises.readFile(fileAbsPath);

      return convertBufferToUint8Array(fileContentBuffer);
    }

    throw new Error(`Unsupported system dir "${fileName}" on master`);
  }

  async requireFile(fileName: string): Promise<any> {
    const pathSplit = fileName.split(PATH_SEPARATOR);

    if (pathSplit[0] === systemConfig.rootDirs.entities) {
      const entityType = pathSplit[1] as ManifestsTypePluralName;
      const entityName: string = pathSplit[2];
      let entityFilePath: string | undefined;

      if (pathSplit[3] === initCfg.fileNames.mainJs) {
        // __main.js
        entityFilePath = __configSet.entitiesSet[entityType][entityName].main;
      }
      else {
        // other entity file
        entityFilePath = this.getEntityFileAbsPath(fileName);
      }

      return require(entityFilePath as string);
    }

    throw new Error(`Sys.dev "requireFile": Unsupported system dir "${fileName}" on master`);
  }


  private getEntityFileAbsPath(virtFileName: string): string {
    const pathSplit = virtFileName.split(PATH_SEPARATOR);
    const entityType = pathSplit[1] as ManifestsTypePluralName;
    const fileName: string = pathSplit.slice(3).join(path.sep);

    const entitySrcDir: string = __configSet.entitiesSet[entityType][pathSplit[2]].srcDir;

    return path.join(entitySrcDir, fileName);
  }

  private getConfig(configName: string): {[index: string]: any} {
    const strippedName: string = trimEnd(configName, '.json');
    const config: any = (__configSet as any)[strippedName];

    if (!config) throw new Error(`Can't find config "${configName}"`);

    return config;
  }


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
