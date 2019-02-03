import * as path from 'path';
import _defaultsDeep = require('lodash/defaultsDeep');

import {ManifestsTypeName} from '../host/interfaces/ManifestTypes';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';
import validateMasterConfig from './validateMasterConfig';
import HostConfig, {HostConfigConfig} from '../host/interfaces/HostConfig';
import hostDefaultConfig from './configs/hostDefaultConfig';
import PlatformConfig from './interfaces/PlatformConfig';
import PreEntityDefinition from './interfaces/PreEntityDefinition';
import Io from './Io';
import {appendArray} from '../host/helpers/helpers';
import {servicesShortcut} from './dict/dict';
import {collectServicesFromShortcuts, convertDefinitions, makeDevicesPlain} from './helpers';


export default class MasterConfig {
  // path to plugins specified in config
  readonly plugins: string[] = [];
  get buildDir(): string {
    return this._buildDir as string;
  }
  get preHostConfig(): PreHostConfig {
    return this._preHostConfig as any;
  }
  get hostConfig(): HostConfig {
    return this._preHostConfig as any;
  }

  private readonly io: Io;
  //private readonly hostDefaults: {[index: string]: any} = {};
  // unprocessed host config
  private _preHostConfig?: PreHostConfig;
  private _hostConfig?: HostConfig;
  // absolute path to master config yaml
  private readonly masterConfigPath: string;
  private _buildDir?: string;


  constructor(io: Io, masterConfigPath: string, absBuildDir?: string) {
    this.io = io;
    this.masterConfigPath = masterConfigPath;
    this._buildDir = absBuildDir;
  }

  async init() {
    const preHostConfig = await this.io.loadYamlFile(this.masterConfigPath) as PreHostConfig;
    const validateError: string | undefined = validateMasterConfig(preHostConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    const mergedConfig: PreHostConfig = await this.mergePreHostConfig(preHostConfig);

    this._preHostConfig = this.normalizeHostConfig(mergedConfig);
    this._hostConfig = this.prepareHostConfig();

    appendArray(this.plugins, this.preHostConfig.plugins);
    //_defaultsDeep(this.hostDefaults, preHostConfig.hostDefaults);
    this._buildDir = this.resolveBuildDir();
  }


  // getHostsIds(): string[] {
  //   return Object.keys(this.preHosts);
  // }

  // // TODO: does it really need ???
  // getPreHostConfig(hostId: string): PreHostConfig {
  //   if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);
  //
  //   return this.preHosts[hostId];
  // }

  // // TODO: review
  // getFinalHostConfig(): HostConfig {
  //   return this.prepareHostConfig();
  // }

  // TODO: review - remake to get machine config
  getHostPlatformDevs(): string[] {
    //const platformName: Platforms = this.preHosts[hostId].platform as Platforms;

    //return this.getPlatformConfig(platformName).devs;
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
      await this.getPlatformConfig().hostConfig,
      hostDefaultConfig,
    );
  }

  private resolveBuildDir(): string {
    // use command argument if specified
    if (this._buildDir) return this._buildDir;

    if (this.preHostConfig.config.storageDir) {
      // use host's storage dir
      const storageDir = this.preHostConfig.config.storageDir;

      if (path.isAbsolute(storageDir)) {
        // it's an absolute path
        return storageDir;
      }
      else {
        // storageDir is relative path - make it absolute, use config file dir as a root
        return path.resolve(path.dirname(this.masterConfigPath), storageDir);
      }
    }

    // use default build dir
    return systemConfig.defaultBuildDir;
  }

  private prepareHostConfig(): HostConfig {
    return {
      id: this.preHostConfig.id as string,
      platform: this.preHostConfig.platform as string,
      machine: this.preHostConfig.machine as string,
      config: this.preHostConfig.config as HostConfigConfig,
    };
  }

  private async getPlatformConfig(): PlatformConfig {
    const hostPlatform: Platforms = preHostConfig.platform as Platforms;
    // TODO: and get machine

    return platforms[hostPlatform];
  }

}

// import Platforms, {
//   PLATFORM_ESP32,
//   PLATFORM_ESP8266,
//   PLATFORM_RPI,
//   PLATFORM_X86
// } from './interfaces/Platforms';
// import platform_esp32 from '../../platforms/squidlet-esp32/platform_esp32';
// import platform_esp8266 from '../../platforms/squidlet-esp8266/platform_esp8266';
// import platform_rpi from '../../squidlet-nodejs/platform_rpi';
// import platform_x86_linux from '../../platforms/squidlet-x86/platform_x86_linux';

// const platforms: {[index: string]: PlatformConfig} = {
//   [PLATFORM_ESP32]: platform_esp32,
//   [PLATFORM_ESP8266]: platform_esp8266,
//   [PLATFORM_RPI]: platform_rpi,
//   [PLATFORM_X86]: platform_x86_linux,
// };


// private resolveHosts(preMasterConfig: PreMasterConfig): {[index: string]: PreHostConfig} {
//   let hosts: {[index: string]: PreHostConfig} = {};
//
//   if (preMasterConfig.hosts) {
//     hosts = preMasterConfig.hosts;
//   }
//   else if (preMasterConfig.host) {
//     hosts = {
//       // TODO: почему называется master - ведь это может быть сборка под мк?
//       master: preMasterConfig.host,
//     };
//   }
//
//   return hosts;
// }
