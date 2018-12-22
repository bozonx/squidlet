import * as path from 'path';

import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import {HostFilesSet} from '../interfaces/HostFilesSet';
import ManifestBase from '../interfaces/ManifestBase';
import {EntitySet} from '../interfaces/EntitySet';
import FsDev from '../interfaces/dev/Fs';
import {ManifestsTypePluralName} from '../interfaces/ManifestTypes';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default abstract class ConfigSetBase implements ConfigSetManager {
  // host config which is integrated at index files init time
  static hostConfigSet: HostFilesSet;

  abstract get configSet(): HostFilesSet;

  private readonly system: System;
  private readonly fs: FsDev;

  constructor(system: System) {
    this.system = system;
    this.fs = this.system.driversManager.getDev('Fs');
  }

  /**
   * Get builtin config
   * @param configFileName - config name like "config.json"
   */
  async loadConfig<T>(configFileName: string): Promise<T> {
    const baseName: string = path.basename(configFileName, '.json');
    const config: T | undefined = (this.configSet as any)[baseName];

    if (!config) {
      throw new Error(`Can't find a config "${configFileName}"`);
    }

    return config;
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

  async loadFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string> {
    // TODO: add
    return '';
  }

}
