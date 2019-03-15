import * as path from 'path';
import _defaultsDeep = require('lodash/defaultsDeep');

import PreHostConfig from './interfaces/PreHostConfig';
import validateHostConfig from './validateHostConfig';
import HostConfig, {HostConfigConfig} from '../host/interfaces/HostConfig';
import hostDefaultConfig from './configs/hostDefaultConfig';
import MachineConfig from './interfaces/MachineConfig';
import Io from './Io';
import {appendArray} from '../host/helpers/helpers';
import {servicesShortcut} from './dict/dict';
import {collectServicesFromShortcuts, convertDefinitions, makeDevicesPlain} from './helpers';
import {loadMachineConfig} from '../helpers/buildHelpers';
import PreEntities from './interfaces/PreEntities';


export default class ConfigManager {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  readonly tmpBuildDir?: string;
  // normalized entities from preConfig
  preEntities: PreEntities = {
    devices: {},
    drivers: {},
    services: {},
  };
  // default devices props from preConfig
  devicesDefaults?: {[index: string]: any};
  get buildDir(): string {
    return this._buildDir as string;
  }
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
  private readonly _buildDir: string;


  constructor(io: Io, hostConfigOrConfigPath: string | PreHostConfig, absBuildDir: string, tmpBuildDir?: string) {
    this.io = io;
    this.hostConfigOrConfigPath = hostConfigOrConfigPath;
    this._buildDir = absBuildDir;
    this.tmpBuildDir = tmpBuildDir;
  }

  async init() {
    const preHostConfig: PreHostConfig = await this.resolveHostConfig();
    const validateError: string | undefined = validateHostConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid host config: ${validateError}`);

    this._machineConfig = this.loadMachineConfig(preHostConfig);

    const mergedConfig: PreHostConfig = await this.mergePreHostConfig(preHostConfig);
    const normalizedConfig: PreHostConfig = this.normalizeHostConfig(mergedConfig);

    this.devicesDefaults = normalizedConfig.devicesDefaults;
    this.preEntities = {
      devices: normalizedConfig.devices || {},
      drivers: normalizedConfig.drivers || {},
      services: normalizedConfig.services || {},
    };
    this._hostConfig = this.prepareHostConfig(normalizedConfig);

    appendArray(this.plugins, normalizedConfig.plugins);
    //this._buildDir = this.resolveBuildDir();
    //this._buildDir = this.resolveBuildDir();

    delete this.hostConfigOrConfigPath;
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
   * Make devices plain, fill services from shortcuts and convert drivers and devices definitions
   */
  private normalizeHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    const plainDevices: {[index: string]: any} = makeDevicesPlain(preHostConfig.devices);

    return {
      ...preHostConfig,
      devices: convertDefinitions('device', plainDevices),
      drivers: convertDefinitions('driver', preHostConfig.drivers || {}),
      services: {
        ...convertDefinitions('service', preHostConfig.services || {}),
        // make services from shortcut
        ...collectServicesFromShortcuts(preHostConfig, servicesShortcut),
      },
    };
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

  // private resolveBuildDir(): string {
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
  //   // if (!this.preHostConfig.defaultEnvSetDir) {
  //   //   throw new Error(`defaultEnvSetDir config param hasn't been specified on current platform.`);
  //   // }
  //   //
  //   // // use default build dir
  //   // return this.preHostConfig.defaultEnvSetDir;
  // }

  private prepareHostConfig(normalizedConfig: PreHostConfig): HostConfig {
    return {
      id: normalizedConfig.id as string,
      platform: normalizedConfig.platform as string,
      machine: normalizedConfig.machine as string,
      config: normalizedConfig.config as HostConfigConfig,
    };
  }

  private loadMachineConfig(preHostConfig: PreHostConfig): MachineConfig {
    const platformDirName = path.resolve(__dirname, `../${preHostConfig.platform}`);

    return loadMachineConfig(platformDirName, preHostConfig.machine as string);
  }

}
