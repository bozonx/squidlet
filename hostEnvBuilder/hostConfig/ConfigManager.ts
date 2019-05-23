import _defaultsDeep = require('lodash/defaultsDeep');

import PreHostConfig from '../interfaces/PreHostConfig';
import HostConfig from '../../system/interfaces/HostConfig';
import MachineConfig from '../interfaces/MachineConfig';
import Os from '../../shared/Os';
import {appendArray} from '../../system/helpers/collections';
import PreEntities from '../interfaces/PreEntities';
import normalizeHostConfig from './normalizeHostConfig';
import {loadMachineConfig, makeIoNames} from '../../shared/helpers';
import {IoItemDefinition} from '../../system/interfaces/IoItem';
import Platforms from '../interfaces/Platforms';
import validateHostConfig from './validateHostConfig';
import hostDefaultConfig from '../configs/hostDefaultConfig';


export default class ConfigManager {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  // normalized entities from preConfig
  preEntities: PreEntities = {
    devices: {},
    drivers: {},
    services: {},
  };
  iosDefinitions: IoItemDefinition = {};
  // default devices props from preConfig
  devicesDefaults?: {[index: string]: any};
  dependencies?: {[index: string]: any};
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


  constructor(os: Os, hostConfigOrConfigPath: string | PreHostConfig) {
    this.os = os;
    this.hostConfigOrConfigPath = hostConfigOrConfigPath;
  }

  async init() {
    const preHostConfig: PreHostConfig = await this.resolveHostConfig();
    const validateError: string | undefined = validateHostConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid host config: ${validateError}`);
    else if (!preHostConfig.platform) throw new Error(`Platform param has to be specified in host config`);

    this._machineConfig = this.loadMachineConfig(preHostConfig);

    const preparedConfig: PreHostConfig = this.mergePreHostConfig(preHostConfig);
    const normalizedConfig: PreHostConfig = normalizeHostConfig(preparedConfig);

    this.dependencies = preparedConfig.dependencies;
    this.devicesDefaults = normalizedConfig.devicesDefaults;
    if (normalizedConfig.ios) this.iosDefinitions = normalizedConfig.ios;
    this.preEntities = {
      devices: normalizedConfig.devices || {},
      drivers: normalizedConfig.drivers || {},
      services: normalizedConfig.services || {},
    };
    this._hostConfig = this.prepareHostConfig(normalizedConfig);

    appendArray(this.plugins, normalizedConfig.plugins);

    delete this.hostConfigOrConfigPath;
  }


  getMachineIos(): string[] {
    return makeIoNames(this.machineConfig.ios);
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

  private prepareHostConfig(normalizedConfig: PreHostConfig): HostConfig {
    return {
      id: normalizedConfig.id as any,
      platform: normalizedConfig.platform as any,
      machine: normalizedConfig.machine as any,
      config: normalizedConfig.config as any,
    };
  }

  private mergePreHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    return _defaultsDeep({},
      preHostConfig,
      this.machineConfig.hostConfig,
      hostDefaultConfig,
    );
  }

  // This wrapper needs for test purpose
  private loadMachineConfig(preHostConfig: PreHostConfig): MachineConfig {
    if (!preHostConfig.platform) {
      throw new Error(`Host config "${preHostConfig.id}" doesn't have a platform param`);
    }
    else if (!preHostConfig.machine) {
      throw new Error(`Host config "${preHostConfig.id}" doesn't have a machine param`);
    }

    return loadMachineConfig(preHostConfig.platform, preHostConfig.machine);
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
