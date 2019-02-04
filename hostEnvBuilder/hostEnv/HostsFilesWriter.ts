import * as path from 'path';

import DefinitionsSet from '../../host/interfaces/DefinitionsSet';
import systemConfig from '../configs/systemConfig';
import {EntitiesNames} from '../entities/EntitiesCollection';
import PreManifestBase from '../interfaces/PreManifestBase';
import HostConfig from '../../host/interfaces/HostConfig';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import ConfigManager from '../ConfigManager';
import Io from '../Io';
import HostClassNames from './HostClassNames';
import HostsFilesSet from './HostsFilesSet';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class HostsFilesWriter {
  private readonly io: Io;
  private readonly configManager: ConfigManager;
  private readonly hostClassNames: HostClassNames;
  private readonly hostsFilesSet: HostsFilesSet;

  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.configManager.buildDir, systemConfig.entityBuildDir);
  }


  constructor(
    io: Io,
    configManager: ConfigManager,
    hostClassNames: HostClassNames,
    hostsFilesSet: HostsFilesSet
  ) {
    this.io = io;
    this.configManager = configManager;
    this.hostClassNames = hostClassNames;
    this.hostsFilesSet = hostsFilesSet;
  }

  /**
   * Copy files of hosts to storage
   * @param skipMaster - don't write master's files
   */
  async writeHostsConfigsFiles(skipMaster: boolean = false) {
    return this.proceedHost();
  }


  private async proceedHost() {
    const hostConfig: HostConfig = this.configManager.hostConfig;
    const definitionsSet: DefinitionsSet = this.hostsFilesSet.getDefinitionsSet();
    //const hostsUsedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames();
    const buildDir = this.configManager.buildDir;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(buildDir, systemConfig.hostSysCfg.rootDirs.configs);

    // write host's config
    await this.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfig
    );

    // write host's definitions
    await this.writeJson(path.join(configDir, fileNames.systemDrivers), definitionsSet.systemDrivers);
    await this.writeJson(path.join(configDir, fileNames.regularDrivers), definitionsSet.regularDrivers);
    await this.writeJson(path.join(configDir, fileNames.systemServices), definitionsSet.systemServices);
    await this.writeJson(path.join(configDir, fileNames.regularServices), definitionsSet.regularServices);
    await this.writeJson(path.join(configDir, fileNames.devicesDefinitions), definitionsSet.devicesDefinitions);
    await this.writeJson(path.join(configDir, fileNames.driversDefinitions), definitionsSet.driversDefinitions);
    await this.writeJson(path.join(configDir, fileNames.servicesDefinitions), definitionsSet.servicesDefinitions);
    // TODO: does it really need????
    // write list of entities names
    //await this.writeJson(path.join(buildDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);
  }

  // TODO: may be move to IO
  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.io.mkdirP(path.dirname(fileName));
    await this.io.writeFile(fileName, content);
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

}
