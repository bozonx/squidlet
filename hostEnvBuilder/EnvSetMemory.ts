/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
import System from '../host/System';
import {ManifestsTypePluralName} from '../host/interfaces/ManifestTypes';
import ManifestBase from '../host/interfaces/ManifestBase';
import {EntityClassType} from '../host/entities/EntityManagerBase';
import HostEnvSet from './interfaces/HostEnvSet';
import {trimEnd} from '../host/helpers/lodashLike';
import {pathJoin} from '../host/helpers/nodeLike';
import StorageDev from '../nodejs/devs/Storage';
import EnvSet from '../host/interfaces/EnvSet';


let configSet: HostEnvSet;


export default class EnvSetMemory implements EnvSet {
  static $registerConfigSet(hostConfigSet: HostEnvSet) {
    configSet = hostConfigSet;
  }

  private readonly system: System;
  private get devStorage(): StorageDev {
    return this.system.devManager.getDev('Storage');
  }


  constructor(system: System) {
    this.system = system;
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

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    const filePath: string = pathJoin(
      configSet.entities[pluralType][entityName].srcDir,
      configSet.entities[pluralType][entityName].manifest.main,
    );

    try {
      return require(filePath).default;

      //import * as ts from 'typescript';
      //import tsOptions from '../tsconfig.json';
      //const tsOptions = require('../tsconfig.json');
      // const content = await this.devStorage.readFile(filePath);
      // let result = ts.transpile(content, tsOptions);
      // return eval(result);
    }
    catch (err) {
      throw new Error(`Tried to load entity "${pluralType}/${entityName}" main file "${filePath}": ${err}`);
    }
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    const filePath: string = pathJoin(configSet.entities[pluralType][entityName].srcDir, fileName);

    return this.devStorage.readFile(filePath);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    const filePath: string = pathJoin(configSet.entities[pluralType][entityName].srcDir, fileName);

    return this.devStorage.readBinFile(filePath);
  }

}
