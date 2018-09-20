const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
import * as path from 'path';

import Main from './Main';
import PreMasterConfig from './interfaces/PreMasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';
import validateMasterConfig from './validateMasterConfig';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import hostDefaultConfig from './configs/hostDefaultConfig';
import Platforms, {
  PLATFORM_ESP32,
  PLATFORM_ESP8266,
  PLATFORM_RPI,
  PLATFORM_X86
} from './interfaces/Platforms';
import PlatformConfig from './interfaces/PlatformConfig';
import platform_esp32 from '../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../platforms/squidlet-x86/platform_x86_linux';


const platforms: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};


export default class MasterConfig {
  readonly plugins: string[];
  private readonly main: Main;
  private readonly hostDefaults: {[index: string]: any};
  private readonly preHosts: {[index: string]: PreHostConfig};
  // storage base dir
  readonly buildDir: string;


  constructor(main: Main, masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.main = main;

    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.plugins = masterConfig.plugins || [];
    this.hostDefaults = masterConfig.hostDefaults || {};
    this.preHosts = this.generatePreHosts(this.resolveHosts(masterConfig));

    // TODO: do it
    //this.buildDir = this.generateBuildDir(masterConfigPath);
    this.buildDir = '';
  }

  getHostsIds(): string[] {
    return Object.keys(this.preHosts);
  }

  getPreHostConfig(hostId: string): PreHostConfig {
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.preHosts[hostId];
  }

  getFinalHostConfig(hostId: string): HostConfig {
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.prepareHostConfig(hostId);
  }

  getHostPlatformDevs(hostId: string): string[] {
    const platformName: Platforms = this.preHosts[hostId].platform as Platforms;
    const platformConfig: PlatformConfig = platforms[platformName];

    return platformConfig.devs;
  }


  private generatePreHosts(preHosts: {[index: string]: PreHostConfig}): {[index: string]: PreHostConfig} {
    const result: {[index: string]: PreHostConfig} = {};

    for (let hostId of Object.keys(preHosts)) {
      const preHostConfig: PreHostConfig = preHosts[hostId];

      result[hostId] = this.mergePreHostConfig(preHostConfig);
    }

    return result;
  }

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
    const masterHostConfig: PreHostConfig = this.getPreHostConfig('master');

    if (masterHostConfig.config.storageDir) {
      // use master's storage dir
      const storageDir = masterHostConfig.config.storageDir;

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

  private prepareHostConfig(id: string): HostConfig {
    return {
      id,
      platform: this.preHosts[id].platform as Platforms,
      config: this.preHosts[id].config as HostConfig['config'],
    };
  }

  private mergePreHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    const hostPlatform: Platforms = preHostConfig.platform as Platforms;
    const platformConfig: PlatformConfig = platforms[hostPlatform];

    return _defaultsDeep(
      _cloneDeep(preHostConfig),
      this.hostDefaults,
      hostDefaultConfig,
      platformConfig.hostConfig,
    );
  }

}
