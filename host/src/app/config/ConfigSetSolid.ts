import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';


export default class ConfigSetSolid implements ConfigSetManager {
  private _system?: System;

  private get system(): System {
    return this._system as System;
  }

  constructor() {

  }

  init(system: System) {
    this._system = system;
  }

  async loadConfig(configName: string): Promise<any> {

  }

  async loadManifest<T>(typeDir: string, entityDir: string) : Promise<T> {

  }

  async loadEntityClass<T>(typeDir: string, entityDir: string) : Promise<T> {

  }

  async loadEntityFile(entityType: string, entityName: string, fileName: string): Promise<string> {

  }

}
