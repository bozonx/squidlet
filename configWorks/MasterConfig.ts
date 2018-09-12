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
  private readonly _plugins: string[] = [];
  private readonly _hostDefaults: {[index: string]: any} = {};
  private readonly _hosts: {[index: string]: PreHostConfig} = {};
  // storage base dir
  readonly buildDir: string;

  get plugins(): string[] {
    return this._plugins;
  }

  get hosts(): {[index: string]: PreHostConfig} {
    return this._hosts;
  }

  get hostDefaults(): {[index: string]: any} {
    return this._hostDefaults;
  }

  constructor(main: Main, masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.main = main;

    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    if (masterConfig.plugins) this._plugins = masterConfig.plugins;
    if (masterConfig.hostDefaults) this._hostDefaults = masterConfig.hostDefaults;

    this._hosts = this.resolveHosts(masterConfig);
    this.buildDir = this.generateBuildDir(masterConfigPath);
  }


  // getPlatformConfig(platformName: Platforms) {
  //
  // }

  private resolveHosts(preMasterConfig: PreMasterConfig): {[index: string]: PreHostConfig} {
    let hosts: {[index: string]: PreHostConfig} = {};

    if (preMasterConfig.hosts) {
      hosts = preMasterConfig.hosts;
    }
    else if (preMasterConfig.host) {
      hosts = {
        master: preMasterConfig.host,
      };
    }

    return hosts;
  }

  private generateBuildDir(masterConfigPath: string): string {
    if (this.hosts.master.config.storageDir) {
      // use master's storage dir
      const storageDir = this.hosts.master.config.storageDir;

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
