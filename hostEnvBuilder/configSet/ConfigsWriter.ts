import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import ConfigManager from '../hostConfig/ConfigManager';
import Os from '../../shared/Os';
import ConfigsSet from './ConfigsSet';
import HostConfigSet from '../interfaces/HostConfigSet';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class ConfigsWriter {
  private readonly os: Os;
  private readonly configManager: ConfigManager;
  private readonly configsSet: ConfigsSet;


  constructor(os: Os, configManager: ConfigManager, configsSet: ConfigsSet) {
    this.os = os;
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
    const configDir = path.join(buildDir, systemConfig.hostSysCfg.envSetDirs.configs);

    // write host's config
    await this.os.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfigSet.config
    );
    // write host's definitions
    await this.os.writeJson(path.join(configDir, fileNames.systemDrivers), hostConfigSet.systemDrivers);
    await this.os.writeJson(path.join(configDir, fileNames.regularDrivers), hostConfigSet.regularDrivers);
    await this.os.writeJson(path.join(configDir, fileNames.systemServices), hostConfigSet.systemServices);
    await this.os.writeJson(path.join(configDir, fileNames.regularServices), hostConfigSet.regularServices);
    await this.os.writeJson(path.join(configDir, fileNames.devicesDefinitions), hostConfigSet.devicesDefinitions);
    await this.os.writeJson(path.join(configDir, fileNames.driversDefinitions), hostConfigSet.driversDefinitions);
    await this.os.writeJson(path.join(configDir, fileNames.servicesDefinitions), hostConfigSet.servicesDefinitions);
    await this.os.writeJson(path.join(configDir, fileNames.iosDefinitions), hostConfigSet.iosDefinitions);
    // TODO: does it really need????
    // write list of entities names
    //await this.writeJson(path.join(buildDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);
  }

}
