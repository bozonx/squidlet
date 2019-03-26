import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import ConfigManager from '../hostConfig/ConfigManager';
import Io from '../Io';
import ConfigsSet from './ConfigsSet';
import HostConfigSet from '../interfaces/HostConfigSet';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class ConfigsWriter {
  private readonly io: Io;
  private readonly configManager: ConfigManager;
  private readonly configsSet: ConfigsSet;


  constructor(io: Io, configManager: ConfigManager, configsSet: ConfigsSet) {
    this.io = io;
    this.configManager = configManager;
    this.configsSet = configsSet;
  }


  /**
   * Copy files of hosts to storage
   */
  async write() {
    const hostConfigSet: HostConfigSet = this.configsSet.getConfigSet();
    //const hostsUsedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames();
    const buildDir = this.configManager.buildDir;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(buildDir, systemConfig.hostSysCfg.rootDirs.configs);

    // write host's config
    await this.io.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfigSet.config
    );
    // write host's definitions
    await this.io.writeJson(path.join(configDir, fileNames.systemDrivers), hostConfigSet.systemDrivers);
    await this.io.writeJson(path.join(configDir, fileNames.regularDrivers), hostConfigSet.regularDrivers);
    await this.io.writeJson(path.join(configDir, fileNames.systemServices), hostConfigSet.systemServices);
    await this.io.writeJson(path.join(configDir, fileNames.regularServices), hostConfigSet.regularServices);
    await this.io.writeJson(path.join(configDir, fileNames.devicesDefinitions), hostConfigSet.devicesDefinitions);
    await this.io.writeJson(path.join(configDir, fileNames.driversDefinitions), hostConfigSet.driversDefinitions);
    await this.io.writeJson(path.join(configDir, fileNames.servicesDefinitions), hostConfigSet.servicesDefinitions);
    // TODO: does it really need????
    // write list of entities names
    //await this.writeJson(path.join(buildDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);
  }

}
