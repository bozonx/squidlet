import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {SysDriver} from '../drivers/Sys/Sys.driver';
import {EntityClassType} from './entities/EntityManagerBase';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class ConfigSet {
  private readonly system: System;
  private readonly sysDriver: SysDriver;

  constructor(system: System) {
    this.system = system;

    this.sysDriver = this.system.driversManager.getDev('Sys.driver');
  }

  /**
   * Get builtin config
   * @param configName - config name without extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    return this.sysDriver.loadConfig(configName) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    return this.sysDriver.loadEntityManifest(pluralType, entityName) as Promise<T>;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    return this.sysDriver.loadEntityMain(pluralType, entityName) as Promise<T>;
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    return this.sysDriver.loadEntityFile(pluralType, entityName, fileName);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    return this.sysDriver.loadEntityBinFile(pluralType, entityName, fileName);
  }

}
