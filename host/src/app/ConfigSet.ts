import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class ConfigSet {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  /**
   * Get builtin config
   * @param configName - config name without extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    return this.system.sysFs.loadConfig(configName) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    return this.system.sysFs.loadEntityManifest(pluralType, entityName) as Promise<T>;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    return this.system.sysFs.loadEntityMain(pluralType, entityName) as Promise<T>;
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    return this.system.sysFs.loadEntityFile(pluralType, entityName, fileName);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    return this.system.sysFs.loadEntityBinFile(pluralType, entityName, fileName);
  }

}
