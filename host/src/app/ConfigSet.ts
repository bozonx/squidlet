import System from './System';
import {HostFilesSet} from './interfaces/HostFilesSet';
import ManifestBase from './interfaces/ManifestBase';
import {EntitySet} from './interfaces/EntitySet';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {SysDriver} from '../drivers/Sys/Sys.driver';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class ConfigSet {

  // TODO: review
  // host config which is integrated at index files init time
  static hostConfigSet: HostFilesSet;

  //abstract get configSet(): HostFilesSet;

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
  async loadConfig<T>(configName: string): Promise<T> {
    return await this.sysDriver.loadConfig(configName) as T;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    if (!this.configSet.entitiesSet[pluralType][entityName]) {
      throw new Error(`Can't find a manifest "${pluralType}, ${entityName}"`);
    }

    return this.configSet.entitiesSet[pluralType][entityName].manifest as T;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    const entitySet: EntitySet = this.configSet.entitiesSet[pluralType][entityName];

    if (!entitySet.main) {
      throw new Error(`Entity "${pluralType}, ${entityName}" does not have a main file`);
    }

    // TODO: в requireJs возможно вернется промис

    // the main file is already resolved
    return require(entitySet.main).default;
  }


  async loadEntityFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string> {
    // TODO: add
    return '';
  }

}
