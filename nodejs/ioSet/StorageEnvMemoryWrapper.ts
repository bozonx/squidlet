import * as path from 'path';
import _trimStart = require('lodash/trimStart');

import {ManifestsTypePluralName} from '../../system/interfaces/ManifestTypes';
import ManifestBase from '../../system/interfaces/ManifestBase';
import StorageIo from '../../system/interfaces/io/StorageIo';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import {splitFirstElement} from '../../system/helpers/strings';
import systemConfig from '../../system/config/systemConfig';
import {getFileNameOfPath} from '../../shared/helpers';


/**
 * It wraps a Storage io instance to load configs and manifests from memory.
 * But other files it loads as an original Storage.
 */
export default class StorageEnvMemoryWrapper {
  private readonly envBuilder: EnvBuilder;
  private readonly envSetDir: string;
  private envSet?: HostEnvSet;


  constructor(envBuilder: EnvBuilder, envSetDir: string) {
    this.envBuilder = envBuilder;
    this.envSetDir = envSetDir;
  }


  async init() {
    console.info(`--> collect configs`);

    await this.envBuilder.collect();

    console.info(`--> generate development envSet`);

    this.envSet = this.envBuilder.generateDevelopEnvSet();
  }


  makeWrapper(originalStorage: StorageIo): StorageIo {
    return {
      ...originalStorage,
      readFile: (pathTo: string) => this.readFile(originalStorage, pathTo),
    };
  }


  private readFile = async (originalStorage: StorageIo, pathTo: string): Promise<string> => {
    if (pathTo.indexOf(this.envSetDir) === -1) return originalStorage.readFile(pathTo);

    const splat = pathTo.split(pathTo);
    const relativePath = _trimStart(splat[1], path.sep);

    if (!relativePath) throw new Error(`StorageEnvMemoryWrapper.readFile: Can't read path "${pathTo}"`);

    const [envsetDir, restPath] = splitFirstElement(relativePath, path.sep);

    if (!restPath) throw new Error(`StorageEnvMemoryWrapper.readFile: empty rest of path`);

    if (envsetDir === systemConfig.envSetDirs.configs) {
      return JSON.stringify(this.loadConfig(restPath));
    }
    else if (envsetDir === systemConfig.envSetDirs.entities) {
      return JSON.stringify(this.loadManifest(restPath));
    }

    return originalStorage.readFile(pathTo);
  }

  /**
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  private loadConfig(configName: string): {[index: string]: any} {
    // cut extension
    const strippedName: string = getFileNameOfPath(configName);
    const config: any = (this.envSet && this.envSet.configs as any)[strippedName];

    if (!config) throw new Error(`StorageEnvMemoryWrapper.loadConfig: Can't find config "${configName}"`);

    return config;
  }

  /**
   * Get builtin manifest
   */
  private loadManifest(entityString: string) : Promise<ManifestBase> {
    const [pluralTypeStr, entityName] = splitFirstElement(entityString, path.sep);
    const pluralType = pluralTypeStr as ManifestsTypePluralName;

    if (!entityName || !this.envSet || !this.envSet.entities[pluralType][entityName]) {
      throw new Error(`StorageEnvMemoryWrapper.loadManifest("${pluralType}", "${entityName}"): Can't find an entity`);
    }

    return this.envSet.entities[pluralType][entityName].manifest as any;
  }


}

// loadEntityFile(
//   pluralType: ManifestsTypePluralName,
//   entityName: string,
//   fileName: string
// ): Promise<string> {
//   const filePath: string = pathJoin(configSet.entities[pluralType][entityName].srcDir, fileName);
//
// return this.ioStorage.readFile(filePath);
// }
//
// loadEntityBinFile(
//   pluralType: ManifestsTypePluralName,
//   entityName: string,
//   fileName: string
// ): Promise<Uint8Array> {
//   const filePath: string = pathJoin(configSet.entities[pluralType][entityName].srcDir, fileName);
//
// return this.ioStorage.readBinFile(filePath);
// }
//
// /**
//  * Require for a main file as is without building.
//  * @param pluralType - devices, drivers or services
//  * @param entityName - name of entity
//  */
// async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
//   const filePath: string = pathJoin(
//     configSet.entities[pluralType][entityName].srcDir,
//     configSet.entities[pluralType][entityName].manifest.main,
//   );
//
//   try {
//     return require(filePath).default;
//   }
//   catch (err) {
//     throw new Error(`Tried to load entity "${pluralType}/${entityName}" main file "${filePath}": ${err}`);
//   }
// }
