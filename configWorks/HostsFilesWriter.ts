import * as path from 'path';

import Main from './Main';
import HostFilesSet from './interfaces/HostFilesSet';
import systemConfig from './configs/systemConfig';
import {AllManifests, ManifestsTypePluralName} from './Entities';
import PreManifestBase from './interfaces/PreManifestBase';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class HostsFilesWriter {
  private readonly main: Main;
  private readonly hostsDir: string;
  private readonly entitiesDir: string;

  constructor(main: Main) {
    this.main = main;
    this.hostsDir = path.join(this.main.masterConfig.buildDir, systemConfig.pathToSaveHostsFileSet);
    this.entitiesDir = path.join(this.main.masterConfig.buildDir, systemConfig.entityBuildDir);
  }

  /**
   * Copy files for hosts to storage to store of master
   */
  async writeToStorage() {
    await this.writeEntitiesFiles();
    await this.writeHostsFiles();
  }


  private async writeEntitiesFiles() {
    // TODO: логичней использовать просто список сущностей
    const allManifests: AllManifests = this.main.entities.getManifests();
    
    for (let typeName of Object.keys(allManifests)) {
      const pluralType: ManifestsTypePluralName = typeName as ManifestsTypePluralName;
      
      for (let entityName of Object.keys(allManifests[pluralType])) {
        await this.proceedEntity(pluralType, entityName);
      }
    }
  }
  
  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDirInStorage = path.join(this.entitiesDir, pluralType, entityName);

    // write manifest
    await this.main.$writeJson(
      path.join(entityDirInStorage, systemConfig.hostInitCfg.fileNames.manifest),
      this.main.entities.getManifest(pluralType, entityName)
    );

    // TODO: build and write main files if exists


    // TODO: write entities files if exists
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, preManifest: PreManifestBase) {
    const entityDirInStorage = path.join(this.entitiesDir, pluralType, preManifest.name);
    const mainJsFile = path.join(entityDirInStorage, systemConfig.hostInitCfg.fileNames.mainJs);

    const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);

    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл
    // TODO: !!!!! поддержка билда js файлов
    // TODO: !!!!! test

  }

  private async writeHostsFiles() {

    // TODO: мастер можно пропустить если указанно

    for (let hostId of this.main.hostsConfigSet.getHostsIds()) {
      
      // TODO: review
      
      const filesSet: HostFilesSet = {
        config: this.main.hostsConfigSet.getHostConfig(hostId),
        entities: this.main.hostsFilesSet.getEntitiesSet(hostId),
        ...this.main.hostsFilesSet.getDefinitionsSet(hostId),
        //...this.main.hostsFilesSet.getDestEntitiesSet(hostId),
      };

      await this.proceedHost(hostId, filesSet);
    }
  }

  private async proceedHost(hostId: string, hostFileSet: HostFilesSet) {
    const hostDir = path.join(this.hostsDir, hostId);
    const hostDirs = systemConfig.hostInitCfg.hostDirs;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(hostDir, hostDirs.config);

    // write host's config
    await this.main.$writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostFileSet.config
    );

    // write host's definitions
    await this.main.$writeJson(path.join(configDir, fileNames.systemDrivers), hostFileSet.systemDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.regularDrivers), hostFileSet.regularDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.systemServices), hostFileSet.systemServices);
    await this.main.$writeJson(path.join(configDir, fileNames.regularServices), hostFileSet.regularServices);
    await this.main.$writeJson(path.join(configDir, fileNames.devicesDefinitions), hostFileSet.devicesDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.driversDefinitions), hostFileSet.driversDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.servicesDefinitions), hostFileSet.servicesDefinitions);

    // TODO: !!! entities
    // TODO: !!! ????
    //await this.main.$writeJson(path.join(hostDir, systemConfig.entitiesFile), hostFileSet.entitiesFiles);
  }

}
