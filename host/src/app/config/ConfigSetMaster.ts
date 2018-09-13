import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import HostConfig from '../interfaces/HostConfig';


export default class ConfigSetMaster implements ConfigSetManager {
  // host config which is integrated at index files init time
  static hostConfig: HostConfig;

  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  async loadConfig<T>(configFileName: string): Promise<T> {

  }

  async loadManifest<T>(typeDir: string, entityDir: string) : Promise<T> {

  }

  async loadEntityClass<T>(typeDir: string, entityDir: string) : Promise<T> {

  }

  async loadEntityFile(entityType: string, entityName: string, fileName: string): Promise<string> {

  }

}
