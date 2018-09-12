import * as path from 'path';

import Main from './Main';
import HostFilesSet, {DefinitionsSet} from './interfaces/HostFilesSet';
import systemConfig from './configs/systemConfig';
import {AllManifests, ManifestsTypePluralName} from './Entities';
import PreManifestBase from './interfaces/PreManifestBase';
import HostConfig from '../host/src/app/interfaces/HostConfig';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class HostsFilesWriter {
  private readonly main: Main;
  private readonly hostsDir: string;
  // entities dir in storage
  private readonly entitiesDstDir: string;

  constructor(main: Main) {
    this.main = main;
    this.hostsDir = path.join(this.main.masterConfig.buildDir, systemConfig.pathToSaveHostsFileSet);
    this.entitiesDstDir = path.join(this.main.masterConfig.buildDir, systemConfig.entityBuildDir);
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

  private async writeHostsFiles() {

    // TODO: мастер можно пропустить если указанно

    for (let hostId of this.main.hostsConfigSet.getHostsIds()) {
      await this.proceedHost(hostId);
    }
  }

  private async proceedEntity(pluralType: ManifestsTypePluralName, entityName: string) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, entityName);
    const entitySrcDir = this.main.entities.getSrcDir(pluralType, entityName);

    // write manifest
    await this.main.$writeJson(
      path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.manifest),
      this.main.entities.getManifest(pluralType, entityName)
    );

    // TODO: build and write main files if exists

    const files: string[] = this.main.entities.getFiles(pluralType, entityName);

    for (let relativeFileName of files) {
      const fromFile = path.resolve(entitySrcDir, relativeFileName);
      const toFileName = path.resolve(entityDstDir, relativeFileName);

      // make inner dirs
      await this.main.io.mkdirP(path.dirname(toFileName));
      // copy
      await this.main.io.copyFile(fromFile, toFileName);
    }
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, preManifest: PreManifestBase) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, preManifest.name);
    const mainJsFile = path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.mainJs);

    const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);

    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл
    // TODO: !!!!! поддержка билда js файлов
    // TODO: !!!!! test

  }

  private async proceedHost(hostId: string) {
    const hostConfig: HostConfig = this.main.hostsConfigSet.getHostConfig(hostId);
    const definitionsSet: DefinitionsSet = this.main.hostsFilesSet.getDefinitionsSet(hostId);
    const hostDir = path.join(this.hostsDir, hostId);
    const hostDirs = systemConfig.hostInitCfg.hostDirs;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(hostDir, hostDirs.config);

    // write host's config
    await this.main.$writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfig
    );

    // TODO: !!! used entities names
    //await this.main.$writeJson(path.join(hostDir, systemConfig.entitiesFile), hostFileSet.entitiesFiles);

    // write host's definitions
    await this.main.$writeJson(path.join(configDir, fileNames.systemDrivers), definitionsSet.systemDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.regularDrivers), definitionsSet.regularDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.systemServices), definitionsSet.systemServices);
    await this.main.$writeJson(path.join(configDir, fileNames.regularServices), definitionsSet.regularServices);
    await this.main.$writeJson(path.join(configDir, fileNames.devicesDefinitions), definitionsSet.devicesDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.driversDefinitions), definitionsSet.driversDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.servicesDefinitions), definitionsSet.servicesDefinitions);
  }

}
