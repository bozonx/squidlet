import _defaultsDeep = require('lodash/defaultsDeep');

import PreHostConfig from '../interfaces/PreHostConfig';
import validateHostConfig from './validateHostConfig';
import HostConfig from '../../system/interfaces/HostConfig';
import hostDefaultConfig from '../configs/hostDefaultConfig';
import MachineConfig from '../interfaces/MachineConfig';
import Io from '../../shared/Io';
import {appendArray} from '../../system/helpers/collections';
import PreEntities from '../interfaces/PreEntities';
import normalizeHostConfig from './normalizeHostConfig';
import {loadMachineConfig, makeDevNames} from '../../shared/helpers';
import DevsDefinitions from '../../system/interfaces/DevsDefinitions';


export default class ConfigManager {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  readonly tmpBuildDir: string;
  // normalized entities from preConfig
  preEntities: PreEntities = {
    devices: {},
    drivers: {},
    services: {},
  };
  devsDefinitions: DevsDefinitions;
  // default devices props from preConfig
  devicesDefaults?: {[index: string]: any};
  // env build dir
  buildDir: string;
  get machineConfig(): MachineConfig {
    return this._machineConfig as any;
  }
  get hostConfig(): HostConfig {
    return this._hostConfig as any;
  }

  private readonly io: Io;
  private _hostConfig?: HostConfig;
  private _machineConfig?: MachineConfig;
  // absolute path to master config yaml
  private hostConfigOrConfigPath: string | PreHostConfig;


  constructor(
    io: Io,
    hostConfigOrConfigPath: string | PreHostConfig,
    absEnvBuildDir: string,
    tmpBuildDir: string
  ) {
    this.io = io;
    this.hostConfigOrConfigPath = hostConfigOrConfigPath;
    this.buildDir = absEnvBuildDir;
    this.tmpBuildDir = tmpBuildDir;
  }

  async init() {
    const preHostConfig: PreHostConfig = await this.resolveHostConfig();
    const validateError: string | undefined = validateHostConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid host config: ${validateError}`);

    this._machineConfig = this.loadMachineConfig(preHostConfig);

    const mergedConfig: PreHostConfig = await this.mergePreHostConfig(preHostConfig);
    const normalizedConfig: PreHostConfig = normalizeHostConfig(mergedConfig);

    this.devicesDefaults = normalizedConfig.devicesDefaults;
    this.devsDefinitions = normalizedConfig.devs || {};
    this.preEntities = {
      devices: normalizedConfig.devices || {},
      drivers: normalizedConfig.drivers || {},
      services: normalizedConfig.services || {},
    };
    this._hostConfig = this.prepareHostConfig(normalizedConfig);

    appendArray(this.plugins, normalizedConfig.plugins);

    delete this.hostConfigOrConfigPath;
  }


  getMachineDevs(): string[] {
    return makeDevNames(this.machineConfig.devs);
  }

  private async resolveHostConfig(): Promise<PreHostConfig> {
    if (typeof this.hostConfigOrConfigPath === 'string') {
      return await this.io.loadYamlFile(this.hostConfigOrConfigPath) as PreHostConfig;
    }
    else if (typeof this.hostConfigOrConfigPath === 'object') {
      return this.hostConfigOrConfigPath;
    }
    else {
      throw new Error(`Unsupported type of host config`);
    }
  }

  /**
   * Merge host config with platform config
   */
  private async mergePreHostConfig(preHostConfig: PreHostConfig): Promise<PreHostConfig> {
    return _defaultsDeep({},
      preHostConfig,
      this.machineConfig.hostConfig,
      hostDefaultConfig,
    );
  }

  private prepareHostConfig(normalizedConfig: PreHostConfig): HostConfig {
    return {
      id: normalizedConfig.id as any,
      platform: normalizedConfig.platform as any,
      machine: normalizedConfig.machine as any,
      config: normalizedConfig.config as any,
    };
  }

  private loadMachineConfig(preHostConfig: PreHostConfig): MachineConfig {
    if (!preHostConfig.platform) {
      throw new Error(`Platform param has to be specified in host config`);
    }

    return loadMachineConfig(preHostConfig.platform, preHostConfig.machine as string);
  }

}


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
