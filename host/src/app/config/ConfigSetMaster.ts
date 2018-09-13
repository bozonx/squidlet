import * as path from 'path';

import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import HostConfig from '../interfaces/HostConfig';
import {SrcHostFilesSet} from '../interfaces/HostFilesSet';
import {ManifestsTypePluralName} from '../../../../configWorks/Entities';
import ManifestBase from '../interfaces/ManifestBase';
import {SrcEntitySet} from '../../../../configWorks/interfaces/EntitySet';
import FsDev from '../interfaces/dev/Fs.dev';


export default class ConfigSetMaster implements ConfigSetManager {
  // host config which is integrated at index files init time
  static hostConfig: HostConfig;

  private readonly system: System;
  private readonly fs: FsDev;

  private get configSet(): SrcHostFilesSet {
    return ConfigSetMaster.hostConfig.config.params.configSet;
  }

  constructor(system: System) {
    this.system = system;
    this.fs = this.system.driversManager.getDev('Fs');
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

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {

    // TODO: путь уже зарезолвен

    const entitySet: SrcEntitySet = this.configSet.entitiesSet[pluralType][entityName];

    if (!entitySet.main) {
      throw new Error(`Entity "${pluralType}, ${entityName}" does not have a main file`);
    }

    const fileName = path.join(entitySet.srcDir, entitySet.main);

    if (!await this.fs.exists(fileName)) {
      throw new Error(`Can't find main file "${fileName}"`);
    }

    return require(fileName);
  }

  async loadFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string> {
    // TODO: add
    return '';
  }

}
