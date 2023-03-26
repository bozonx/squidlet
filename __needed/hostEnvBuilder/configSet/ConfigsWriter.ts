import * as path from 'path';

import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/systemConfig.js';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import ConfigsSet from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configSet/ConfigsSet.js';
import HostConfigSet from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostConfigSet.js';
import {OwnerOptions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/interfaces/OnwerOptions.js';


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
    const fileNames = systemConfig.hostSysCfg.fileNames;
    const configDir = path.join(this.buildDir, systemConfig.hostSysCfg.envSetDirs.configs);

    // write host's config
    await this.os.writeJson(
      path.join(configDir, systemConfig.hostSysCfg.fileNames.hostConfig),
      hostConfigSet.config,
      this.ownerOptions
    );
    // write host's definitions
    await this.os.writeJson(path.join(configDir, fileNames.driversList), hostConfigSet.driversList, this.ownerOptions);
    await this.os.writeJson(path.join(configDir, fileNames.servicesList), hostConfigSet.servicesList, this.ownerOptions);
    await this.os.writeJson(path.join(configDir, fileNames.devicesDefinitions), hostConfigSet.devicesDefinitions, this.ownerOptions);
    await this.os.writeJson(path.join(configDir, fileNames.driversDefinitions), hostConfigSet.driversDefinitions, this.ownerOptions);
    await this.os.writeJson(path.join(configDir, fileNames.servicesDefinitions), hostConfigSet.servicesDefinitions, this.ownerOptions);
    await this.os.writeJson(path.join(configDir, fileNames.iosDefinitions), hostConfigSet.iosDefinitions, this.ownerOptions);
    // TODO: does it really need????
    // write list of entities names
    //await this.writeJson(path.join(buildDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);
  }

}
