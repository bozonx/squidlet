const _omit = require('lodash/omit');
import * as path from 'path';

import Main from './Main';
import Platforms from './interfaces/Platforms';
import PreMasterConfig from './interfaces/PreMasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';
import validateMasterConfig from './validateMasterConfig';


export default class MasterConfig {
  private readonly main: Main;
  private readonly masterConfig: PreMasterConfig;
  readonly buildDir: string;

  get plugins() {
    return this.masterConfig.plugins;
  }

  constructor(main: Main, masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.main = main;
    this.masterConfig = masterConfig;

    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);


    //this.masterConfig = prepareMasterConfig(masterConfig);

    this.buildDir = this.generateBuildDir(this.masterConfig, masterConfigPath);
  }

  get masterConfigHosts(): {[index: string]: PreHostConfig} {
    return this.masterConfig.hosts as {[index: string]: PreHostConfig};
  }

  getPlatformConfig(platFormName: Platforms) {

  }

  private prepareMasterConfig(preMasterConfig: {[index: string]: any}): PreMasterConfig {
    let hosts: {[index: string]: PreHostConfig} = {};

    if (preMasterConfig.hosts) {
      hosts = preMasterConfig.hosts;
    }
    else if (preMasterConfig.host) {
      hosts = {
        master: preMasterConfig.host,
      };
    }

    return {
      ..._omit(preMasterConfig, 'host', 'hosts'),
      hosts
    };
  }

  private generateBuildDir(masterConfig: PreMasterConfig, masterConfigPath: string): string {
    if (masterConfig.hosts && masterConfig.hosts.master.host.storageDir) {
      // use master's storage dir
      const storageDir = masterConfig.hosts.master.host.storageDir;

      if (path.isAbsolute(masterConfigPath)) {
        // it's an absolute path
        return storageDir;
      }
      else {
        // relative path - make it relative to config file
        return path.join(path.dirname(masterConfigPath), storageDir);
      }
    }

    // use default build dir
    return systemConfig.defaultDuildDir;
  }

}
