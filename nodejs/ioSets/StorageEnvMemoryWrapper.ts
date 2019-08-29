import * as path from 'path';

import {EntityTypePlural} from '../../system/interfaces/EntityTypes';
import ManifestBase from '../../system/interfaces/ManifestBase';
import StorageIo from '../../system/interfaces/io/StorageIo';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import {splitFirstElement} from '../../system/lib/strings';
import systemConfig from '../../system/config/systemConfig';
import {getFileNameOfPath} from '../../shared/helpers';
import {trimStart} from '../../system/lib/lodashLike';


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
    console.info(`===> generate development envSet`);

    this.envSet = this.envBuilder.generateDevelopEnvSet();
  }


  makeWrapper(originalStorage: StorageIo): StorageIo {
    const originalReadFile = originalStorage.readFile.bind(originalStorage);

    originalStorage.readFile = (pathTo: string) => this.readFile(originalReadFile, pathTo);

    return originalStorage;
  }


  private readFile = async (
    originalReadFile: (pathTo: string) => Promise<string>,
    pathTo: string
  ): Promise<string> => {
    // if it isn't config or entity file - just load it.
    if (pathTo.indexOf(this.envSetDir) === -1) return originalReadFile(pathTo);

    const splat: string[] = pathTo.split(this.envSetDir);
    const relativePath: string = trimStart(splat[1], path.sep);

    if (!relativePath) throw new Error(`StorageEnvMemoryWrapper.readFile: Can't read path "${pathTo}"`);

    const [envSetDir, restPath] = splitFirstElement(relativePath, path.sep);

    if (!restPath) throw new Error(`StorageEnvMemoryWrapper.readFile: empty rest of path`);

    if (envSetDir === systemConfig.envSetDirs.configs) {
      return JSON.stringify(this.loadConfig(restPath));
    }
    else if (envSetDir === systemConfig.envSetDirs.entities) {
      return JSON.stringify(this.loadManifest(restPath));
    }

    return originalReadFile(pathTo);
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
  private loadManifest(entityString: string): ManifestBase {
    const [pluralTypeStr, rest] = splitFirstElement(entityString, path.sep);
    const pluralType = pluralTypeStr as EntityTypePlural;

    if (!rest) {
      throw new Error(`StorageEnvMemoryWrapper.loadManifest("${entityString}"): Can't parse entity name`);
    }

    // get entity name of 'ConsoleLogger/manifest.json'
    const entityName: string = splitFirstElement(rest, path.sep)[0];

    if (!entityName || !this.envSet || !this.envSet.entities[pluralType][entityName]) {
      throw new Error(`StorageEnvMemoryWrapper.loadManifest("${pluralType}", "${entityName}"): Can't find an entity`);
    }

    return {
      ...this.envSet.entities[pluralType][entityName].manifest,
      srcDir: this.envSet.entities[pluralType][entityName].srcDir,
    };
  }

}


//return this.prepareManifest(pluralType, entityName);
// /**
//  * Make all the paths absolute
//  */
// private prepareManifest(pluralType: EntityTypePlural, entityName: string): ManifestBase {
//   if (!entityName || !this.envSet || !this.envSet.entities[pluralType][entityName]) {
//     throw new Error(`StorageEnvMemoryWrapper.prepareManifest("${pluralType}", "${entityName}"): Can't find an entity`);
//   }
//
//   const entitySet: HostEntitySet = this.envSet.entities[pluralType][entityName];
//   const manifest: ManifestBase = _cloneDeep(this.envSet.entities[pluralType][entityName].manifest);
//
//   manifest.main = path.join(entitySet.srcDir, manifest.main);
//
//   return manifest;
// }

// loadEntityFile(
//   pluralType: EntityTypePlural,
//   entityName: string,
//   fileName: string
// ): Promise<string> {
//   const filePath: string = pathJoin(configSet.entities[pluralType][entityName].srcDir, fileName);
//
// return this.ioStorage.readFile(filePath);
// }
//
// loadEntityBinFile(
//   pluralType: EntityTypePlural,
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
// async loadMain<T extends EntityClassType>(pluralType: EntityTypePlural, entityName: string): Promise<T> {
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
