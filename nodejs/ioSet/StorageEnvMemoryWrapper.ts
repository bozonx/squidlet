/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
import {ManifestsTypePluralName} from '../../system/interfaces/ManifestTypes';
import ManifestBase from '../../system/interfaces/ManifestBase';
import {EntityClassType} from '../../system/entities/EntityManagerBase';
import {trimEnd} from '../../system/helpers/lodashLike';
import {pathJoin} from '../../system/helpers/nodeLike';
import StorageIo from '../../system/interfaces/io/StorageIo';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';


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

    this.envSet = this.envBuilder.generateHostEnvSet();
  }


  makeWrapper(originalStorage: StorageIo): StorageIo {
    return {
      ...originalStorage,
      readFile: (pathTo: string) => this.readFile(originalStorage, pathTo),
    };
  }

  /**
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  async loadConfig<T>(configName: string): Promise<T> {
    const strippedName: string = trimEnd(configName, '.json');
    const config: any = (configSet.configs as any)[strippedName];

    if (!config) throw new Error(`Can't find config "${configName}"`);

    return config;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    if (!configSet.entities[pluralType][entityName]) {
      throw new Error(`EnvSetMemory.loadManifest("${pluralType}", "${entityName}"): Can't find an entity`);
    }

    return configSet.entities[pluralType][entityName].manifest as T;
  }


  private readFile = (originalStorage: StorageIo, pathTo: string): Promise<string> => {
    if (pathTo.indexOf(envSetDir) === -1) return originalStorage.readFile(pathTo);

    // TODO: определить что это configs или enriries
    // TODO: убрать расширение
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
