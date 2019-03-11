import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';
import SysFsDriver from './interfaces/SysFsDriver';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class EnvSetLocalFs {
  private readonly system: System;

  private get sysFs(): SysFsDriver {
    return this.system.driversManager.getDriver('SysFs');
  }


  constructor(system: System) {
    this.system = system;
  }


  /**
   * Get builtin config
   * @param configName - config name without extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    return this.sysFs.loadConfig(configName) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    return this.sysFs.loadEntityManifest(pluralType, entityName) as Promise<T>;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    return this.sysFs.loadEntityMain(pluralType, entityName) as Promise<T>;
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    return this.sysFs.loadEntityFile(pluralType, entityName, fileName);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    return this.sysFs.loadEntityBinFile(pluralType, entityName, fileName);
  }

}
