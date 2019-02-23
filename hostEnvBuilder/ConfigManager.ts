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


export default class ConfigManager {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  readonly tmpBuildDir?: string;
  get buildDir(): string {
    return this._buildDir as string;
  }
  get preHostConfig(): PreHostConfig {
    return this._preHostConfig as any;
  }
  get hostConfig(): HostConfig {
    return this._hostConfig as any;
  }
  get machineConfig(): MachineConfig {
    return this._machineConfig as any;
  }

  private readonly io: Io;
  // unprocessed host config
  private _preHostConfig?: PreHostConfig;
  private _hostConfig?: HostConfig;
  private _machineConfig?: MachineConfig;
  // absolute path to master config yaml
  private hostConfigOrConfigPath: string | PreHostConfig;
  private _buildDir?: string;


  constructor(io: Io, hostConfigOrConfigPath: string | PreHostConfig, absBuildDir?: string, tmpBuildDir?: string) {
    this.io = io;
    this.hostConfigOrConfigPath = hostConfigOrConfigPath;
    this._buildDir = absBuildDir;
    this.tmpBuildDir = tmpBuildDir;
  }

  async init() {
    const preHostConfig: PreHostConfig = await this.resolveHostConfig();
    const validateError: string | undefined = validateHostConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid host config: ${validateError}`);

    const platformDirName = path.resolve(__dirname, `../${preHostConfig.platform}`);

    this._machineConfig = loadMachineConfig(platformDirName, preHostConfig.machine as string);

    const mergedConfig: PreHostConfig = await this.mergePreHostConfig(preHostConfig);

    this._preHostConfig = this.normalizeHostConfig(mergedConfig);
    this._hostConfig = this.prepareHostConfig();

    appendArray(this.plugins, this.preHostConfig.plugins);
    this._buildDir = this.resolveBuildDir();

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
      //this.hostDefaults,
      this.machineConfig.hostConfig,
      hostDefaultConfig,
    );
  }

  private resolveBuildDir(): string {
    // use command argument if specified
    if (this._buildDir) return this._buildDir;

    // TODO: review - use defaultEnvDir

    if (this.preHostConfig.config && this.preHostConfig.config.storageDir) {
      // use host's storage dir
      const storageDir = this.preHostConfig.config.storageDir;

      if (path.isAbsolute(storageDir)) {
        // it's an absolute path
        return storageDir;
      }
      else {
        if (typeof this.hostConfigOrConfigPath !== 'string') {
          throw new Error(`Can't resolve storage dir. There isn't a relative host config path`);
        }

        // storageDir is relative path - make it absolute, use config file dir as a root
        return path.resolve(path.dirname(this.hostConfigOrConfigPath), storageDir);
      }
    }

    if (!this.preHostConfig.defaultStorageDir) {
      throw new Error(`defaultStorageDir config param hasn't been specified on current platform.`);
    }

    // use default build dir
    return this.preHostConfig.defaultStorageDir;
  }

  private prepareHostConfig(): HostConfig {
    return {
      id: this.preHostConfig.id as string,
      platform: this.preHostConfig.platform as string,
      machine: this.preHostConfig.machine as string,
      config: this.preHostConfig.config as HostConfigConfig,
    };
  }

}
