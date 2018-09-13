import * as path from 'path';

import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import HostConfig from '../interfaces/HostConfig';
import HostFilesSet from '../interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../../configWorks/Entities';
import ManifestBase from '../interfaces/ManifestBase';


export default class ConfigSetMaster implements ConfigSetManager {
  // host config which is integrated at index files init time
  static hostConfig: HostConfig;

  private readonly system: System;

  private get configSet(): HostFilesSet {
    return ConfigSetMaster.hostConfig.config.params.configSet;
  }

  constructor(system: System) {
    this.system = system;
  }

  /**
   * Get builtin config
   * @param configFileName - config name like "config.json"
   */
  async loadConfig<T>(configFileName: string): Promise<T> {
    const baseName: string = path.basename(configFileName, 'json');
    const config: T | undefined = (this.configSet as any)[baseName];

    if (!config) {
      throw new Error(`Can't find a config file "${configFileName}"`);
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

  async loadEntityClass<T>(typeDir: string, entityDir: string) : Promise<T> {

  }

  async loadEntityFile(entityType: string, entityName: string, fileName: string): Promise<string> {

  }

}
