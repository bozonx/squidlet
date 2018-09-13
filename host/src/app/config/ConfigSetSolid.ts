import ConfigSetManager from '../interfaces/ConfigSetManager';
import System from '../System';
import ManifestBase from '../interfaces/ManifestBase';
import {ManifestsTypePluralName} from '../../../../configWorks/Entities';
import {SrcHostFilesSet} from '../interfaces/HostFilesSet';
import FsDev from '../interfaces/dev/Fs.dev';


export default class ConfigSetSolid implements ConfigSetManager {
  private readonly system: System;
  private readonly fs: FsDev;

  private get configSet(): SrcHostFilesSet {
    // TODO: get it from global
  }

  constructor(system: System) {
    this.system = system;
    this.fs = this.system.driversManager.getDev('Fs');
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
