import * as path from 'path';

import DefinitionsSet from '../../host/interfaces/DefinitionsSet';
import systemConfig from '../configs/systemConfig';
import HostConfig from '../../host/interfaces/HostConfig';
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
   */
  async writeHostsConfigsFiles() {
    const hostConfig: HostConfig = this.configManager.hostConfig;
    const definitionsSet: DefinitionsSet = this.hostsFilesSet.getDefinitionsSet();
    //const hostsUsedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames();
    const buildDir = this.configManager.buildDir;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(buildDir, systemConfig.hostSysCfg.rootDirs.configs);

    // write host's config
    await this.io.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfig
    );

    // write host's definitions
    await this.io.writeJson(path.join(configDir, fileNames.systemDrivers), definitionsSet.systemDrivers);
    await this.io.writeJson(path.join(configDir, fileNames.regularDrivers), definitionsSet.regularDrivers);
    await this.io.writeJson(path.join(configDir, fileNames.systemServices), definitionsSet.systemServices);
    await this.io.writeJson(path.join(configDir, fileNames.regularServices), definitionsSet.regularServices);
    await this.io.writeJson(path.join(configDir, fileNames.devicesDefinitions), definitionsSet.devicesDefinitions);
    await this.io.writeJson(path.join(configDir, fileNames.driversDefinitions), definitionsSet.driversDefinitions);
    await this.io.writeJson(path.join(configDir, fileNames.servicesDefinitions), definitionsSet.servicesDefinitions);
    // TODO: does it really need????
    // write list of entities names
    //await this.writeJson(path.join(buildDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);
  }

}
