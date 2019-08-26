import * as path from 'path';

import systemConfig from '../configs/systemConfig';
import Os from '../../shared/Os';
import ConfigsSet from './ConfigsSet';
import HostConfigSet from '../interfaces/HostConfigSet';
import {OwnerOptions} from '../../shared/interfaces/OnwerOptions';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class ConfigsWriter {
  private readonly os: Os;
  private readonly configsSet: ConfigsSet;
  private readonly buildDir: string;
  private readonly ownerOptions?: OwnerOptions;


  constructor(os: Os, configsSet: ConfigsSet, buildDir: string, ownerOptions?: OwnerOptions) {
    this.os = os;
    this.configsSet = configsSet;
    this.buildDir = buildDir;
    this.ownerOptions = ownerOptions;
  }


  /**
   * Copy files of hosts to storage
   */
  async write() {
    const hostConfigSet: HostConfigSet = this.configsSet.getConfigSet();
    //const hostsUsedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames();
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(this.buildDir, systemConfig.hostSysCfg.envSetDirs.configs);

    // TODO: use uid and gid
    // write host's config
    await this.os.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfigSet.config
    );
    // TODO: use uid and gid
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
