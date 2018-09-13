import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import ManifestBase from '../interfaces/ManifestBase';
import {ManifestsTypePluralName} from '../../../../configWorks/Entities';


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

  async loadConfig<T>(configFileName: string): Promise<T> {

  }

  async loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {

  }

  async loadMain<T>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {

  }

  async loadFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string> {

  }

}
