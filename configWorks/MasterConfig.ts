import PlatformConfig from './interfaces/PlatformConfig';

const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
import * as path from 'path';

import Main from './Main';
import PreMasterConfig from './interfaces/PreMasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';
import validateMasterConfig from './validateMasterConfig';
import Platforms, {
  PLATFORM_ESP32,
  PLATFORM_ESP8266,
  PLATFORM_RPI,
  PLATFORM_X86
} from './interfaces/Platforms';
import platform_esp32 from '../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../platforms/squidlet-x86/platform_x86_linux';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import hostDefaultConfig from './configs/hostDefaultConfig';


const platforms: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};


export default class MasterConfig {
  private readonly main: Main;
  private readonly _plugins: string[] = [];
  private readonly hostDefaults: {[index: string]: any} = {};
  private readonly preHosts: {[index: string]: PreHostConfig} = {};
  private readonly finalHosts: {[index: string]: HostConfig} = {};
  // storage base dir
  readonly buildDir: string;

  get plugins(): string[] {
    return this._plugins;
  }


  constructor(main: Main, masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.main = main;

    // TODO: move to generate

    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    if (masterConfig.plugins) this._plugins = masterConfig.plugins;
    if (masterConfig.hostDefaults) this.hostDefaults = masterConfig.hostDefaults;


    // TODO: отдать готовый - нужно убрать drivers, services, devices

    this.preHosts = this.mergeHostsWithPlatformConfig(this.resolveHosts(masterConfig));
    this.buildDir = this.generateBuildDir(masterConfigPath);
  }

  getHostsIds(): string[] {
    return Object.keys(this.preHosts);
  }

  getPreHostConfig(hostId: string): PreHostConfig {
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.preHosts[hostId];
  }

  getFinalHostConfig(hostId: string): HostConfig {
    if (!this.finalHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.finalHosts[hostId];
  }

  generate() {
    // TODO: !!!!
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.hosts;

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig: PreHostConfig = rawHostsConfigs[hostId];

      // final host config
      this.hostsConfigs[hostId] = this.generateHostConfig(rawHostConfig);
    }
  }


  // TODO: review
  private mergeHostsWithPlatformConfig(hosts: {[index: string]: PreHostConfig}): {[index: string]: PreHostConfig} {
    const result: {[index: string]: PreHostConfig} = {};

    for (let hostId of Object.keys(hosts)) {
      // platform is validated at the moment
      const hostPlatform: Platforms = hosts[hostId].platform as Platforms;
      const platformConfig: PlatformConfig = platforms[hostPlatform];

      result[hostId] = _defaultsDeep(_cloneDeep(hosts[hostId]), platformConfig.hostConfig);
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

  private mergePreHostConfig(rawHostConfig: PreHostConfig): HostConfig {

    // TODO: почему получается HostConfig если не вычищаются drivers, services и тд ???
    // TODO: смержить ещё с platform config
    // TODO: смержить ещё с build config

    return _defaultsDeep(
      _cloneDeep(rawHostConfig),
      this.hostDefaults,
      hostDefaultConfig
    );
  }

}
