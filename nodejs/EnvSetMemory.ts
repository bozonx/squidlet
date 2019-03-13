/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
import System from '../host/System';
import SysFsDriver from '../host/interfaces/SysFsDriver';
import {ManifestsTypePluralName} from '../host/interfaces/ManifestTypes';
import ManifestBase from '../host/interfaces/ManifestBase';
import {EntityClassType} from '../host/entities/EntityManagerBase';
import SrcHostEnvSet from '../hostEnvBuilder/interfaces/SrcHostEnvSet';
import {trimEnd} from '../host/helpers/lodashLike';
import systemConfig from '../host/config/systemConfig';


let configSet: SrcHostEnvSet;


export default class EnvSetMemory {
  static $setConfigSet(hostConfigSet: SrcHostEnvSet) {
    configSet = hostConfigSet;
  }

  private readonly system: System;

  private get sysFs(): SysFsDriver {
    return this.system.driversManager.getDriver('SysFs');
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
    //return this.sysFs.loadEntityMain(pluralType, entityName) as Promise<T>;
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    //return this.sysFs.loadEntityFile(pluralType, entityName, fileName);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    //return this.sysFs.loadEntityBinFile(pluralType, entityName, fileName);
  }

}
