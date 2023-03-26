import _defaultsDeep = require('lodash/defaultsDeep');

import PreHostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreHostConfig.js';
import HostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostConfig.js';
import MachineConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/MachineConfig.js';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import PreEntities from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreEntities.js';
import normalizeHostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/normalizeHostConfig.js';
import {
  appendArray,
  loadMachineConfigInPlatformDir,
  resolvePlatformDir
} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/helpers.js';
import {IoDefinitions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';
import validateHostConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/validateHostConfig.js';
import hostDefaultConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/hostDefaultConfig.js';
import Platforms from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import {AppType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';


export default class ConfigManager {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  // normalized entities from preConfig
  preEntities: PreEntities = {
    devices: {},
    drivers: {},
    services: {},
  };
  iosDefinitions: IoDefinitions = {};
  // default devices props from preConfig
  devicesDefaults?: {[index: string]: any};
  //dependencies?: {[index: string]: any};
  readonly platform: Platforms;
  readonly machine: string;
  machinePlatformDir: string = '';
  get machineConfig(): MachineConfig {
    return this._machineConfig as any;
  }
  get hostConfig(): HostConfig {
    return this._hostConfig as any;
  }

  private readonly os: Os;
  private _hostConfig?: HostConfig;
  private _machineConfig?: MachineConfig;
  // absolute path to master config yaml
  private hostConfigOrConfigPath: string | PreHostConfig;


  constructor(
    os: Os,
    hostConfigOrConfigPath: string | PreHostConfig,
    platform: Platforms,
    machine: string,
  ) {
    this.os = os;
    this.hostConfigOrConfigPath = hostConfigOrConfigPath;
    this.platform = platform;
    this.machine = machine;
  }

  async init() {
    const preHostConfig: PreHostConfig = await this.resolveHostConfig();

    this.machinePlatformDir = resolvePlatformDir(this.platform);
    this._machineConfig = this.loadMachineConfig(preHostConfig);

    const normalizedConfig: PreHostConfig = this.preparePreHostConfig(preHostConfig);

    //this.dependencies = normalizedConfig.dependencies;
    this.devicesDefaults = normalizedConfig.devicesDefaults;
    this.iosDefinitions = normalizedConfig.ios || {};

    this.preEntities = {
      devices: normalizedConfig.devices || {},
      drivers: normalizedConfig.drivers || {},
      services: normalizedConfig.services || {},
    };
    this._hostConfig = this.finalizeHostConfig(normalizedConfig);

    appendArray(this.plugins, normalizedConfig.plugins);

    delete this.hostConfigOrConfigPath;
  }


  getMachineIos(): string[] {
    return Object.keys(this.machineConfig.ios);
  }


  private async resolveHostConfig(): Promise<PreHostConfig> {
    if (typeof this.hostConfigOrConfigPath === 'string') {
      return await this.os.loadYamlFile(this.hostConfigOrConfigPath) as PreHostConfig;
    }
    else if (typeof this.hostConfigOrConfigPath === 'object') {
      return this.hostConfigOrConfigPath;
    }
    else {
      throw new Error(`Unsupported type of host config`);
    }
  }

  private finalizeHostConfig(normalizedConfig: PreHostConfig): HostConfig {
    // set default appType here
    const appType: AppType = 'app';

    return {
      id: normalizedConfig.id as any,
      platform: this.platform as any,
      machine: this.machine as any,
      appType,
      config: normalizedConfig.config as any,
    };
  }

  private preparePreHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    const validateError: string | undefined = validateHostConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid host config: ${validateError}`);

    const preparedConfig: PreHostConfig = this.mergePreHostConfig(preHostConfig);

    return  normalizeHostConfig(preparedConfig);
  }

  /**
   * Merge specified host config with machine config and defaults
   */
  private mergePreHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    return _defaultsDeep({},
      preHostConfig,
      this.machineConfig.hostConfig,
      hostDefaultConfig,
    );
  }

  // This wrapper needs for test purpose
  private loadMachineConfig(preHostConfig: PreHostConfig): MachineConfig {
    // TODO: review
    if (!this.platform) {
      throw new Error(`Host config "${preHostConfig.id}" doesn't have a platform param`);
    }
    else if (!this.machine) {
      throw new Error(`Host config "${preHostConfig.id}" doesn't have a machine param`);
    }

    return loadMachineConfigInPlatformDir(this.os, this.machinePlatformDir, this.machine);

    //return loadMachineConfig(preHostConfig.platform, preHostConfig.machine);
  }

}


// const validateError: string | undefined = validateHostConfig(preHostConfig);
//
// if (validateError) throw new Error(`Invalid host config: ${validateError}`);
//const mergedConfig: PreHostConfig = await this.mergePreHostConfig(preHostConfig);

// /**
//  * Merge host config with platform config
//  */
// private async mergePreHostConfig(preHostConfig: PreHostConfig): Promise<PreHostConfig> {
//   return _defaultsDeep({},
//     preHostConfig,
//     this.machineConfig.hostConfig,
//     hostDefaultConfig,
//   );
// }

// private loadMachineConfig(preHostConfig: PreHostConfig): MachineConfig {
//   if (!preHostConfig.platform) {
//     throw new Error(`Platform param has to be specified in host config`);
//   }
//
//   return loadMachineConfig(preHostConfig.platform, preHostConfig.machine as string);
// }


// private resolveBuildDir(normalizedConfig: PreHostConfig): string {
//   // use command argument if specified
//   if (this._buildDir) return this._buildDir;
//
//   // if (this.preHostConfig.config && this.preHostConfig.config.storageDir) {
//   //   // use host's storage dir
//   //   const storageDir = this.preHostConfig.config.storageDir;
//   //
//   //   if (path.isAbsolute(storageDir)) {
//   //     // it's an absolute path
//   //     return storageDir;
//   //   }
//   //   else {
//   //     if (typeof this.hostConfigOrConfigPath !== 'string') {
//   //       throw new Error(`Can't resolve storage dir. There isn't a relative host config path`);
//   //     }
//   //
//   //     // storageDir is relative path - make it absolute, use config file dir as a root
//   //     return path.resolve(path.dirname(this.hostConfigOrConfigPath), storageDir);
//   //   }
//   // }
//
//   if (!normalizedConfig.config || !normalizedConfig.config.envSetDir) {
//     throw new Error(`envSetDir config param hasn't been specified on current platform.`);
//   }
//
//   // TODO: review
//
//   // use default build dir
//   return normalizedConfig.config.envSetDir;
// }
