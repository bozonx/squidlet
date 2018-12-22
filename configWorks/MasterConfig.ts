import * as path from 'path';
import _omit = require('lodash/omit');
import _defaultsDeep = require('lodash/defaultsDeep');
import _cloneDeep = require('lodash/cloneDeep');

import {ManifestsTypeName} from '../host/src/app/interfaces/ManifestTypes';
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
} from '../host/src/app/interfaces/Platforms';
import PlatformConfig from '../host/src/app/interfaces/PlatformConfig';
import platform_esp32 from '../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../platforms/squidlet-x86/platform_x86_linux';
import PreEntityDefinition from './interfaces/PreEntityDefinition';


const platforms: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};

const servicesShortcut: {[index: string]: string} = {
  automation: 'Automation',
  mqtt: 'Mqtt',
  logger: 'Logger',
  webApi: 'WebApi',
};


export default class MasterConfig {
  readonly plugins: string[];
  private readonly hostDefaults: {[index: string]: any};
  private readonly preHosts: {[index: string]: PreHostConfig};
  // storage base dir
  readonly buildDir: string;


  constructor(masterConfig: PreMasterConfig, masterConfigPath: string) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.plugins = masterConfig.plugins || [];
    this.hostDefaults = masterConfig.hostDefaults || {};
    this.preHosts = this.generatePreHosts(this.resolveHosts(masterConfig));

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
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.prepareHostConfig(hostId);
  }

  getHostPlatformDevs(hostId: string): string[] {
    const platformName: Platforms = this.preHosts[hostId].platform as Platforms;

    return this.getPlatformConfig(platformName).devs;
  }


  private generatePreHosts(preHosts: {[index: string]: PreHostConfig}): {[index: string]: PreHostConfig} {
    const result: {[index: string]: PreHostConfig} = {};

    for (let hostId of Object.keys(preHosts)) {
      const preHostConfig: PreHostConfig = preHosts[hostId];

      const mergedConfig: PreHostConfig = this.mergePreHostConfig(preHostConfig);
      result[hostId] = this.normalizeHostConfig(mergedConfig);
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

      if (path.isAbsolute(storageDir)) {
        // it's an absolute path
        return storageDir;
      }
      else {
        // storageDir is relative path - make it absolute, use config file dir as a root
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

  /**
   * Merge host config with platform config
   * @param preHostConfig
   */
  private mergePreHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    const hostPlatform: Platforms = preHostConfig.platform as Platforms;

    return _defaultsDeep(
      _cloneDeep(preHostConfig),
      this.hostDefaults,
      hostDefaultConfig,
      this.getPlatformConfig(hostPlatform).hostConfig,
    );
  }

  private getPlatformConfig(hostPlatform: Platforms): PlatformConfig {
    return platforms[hostPlatform];
  }

  /**
   * Make devices plain
   */
  private normalizeHostConfig(preHostConfig: PreHostConfig): PreHostConfig {
    const plainDevices: {[index: string]: any} = this.makeDevicesPlain(preHostConfig.devices);

    return {
      ...preHostConfig,
      devices: this.convertDefinitions('device', plainDevices),
      drivers: this.convertDefinitions('driver', preHostConfig.drivers || {}),
      services: {
        ...this.convertDefinitions('service', preHostConfig.services || {}),
        // make services from shortcut
        ...this.collectServicesFromShortcuts(preHostConfig),
      },
    };
  }

  /**
   * Make devices plain
   */
  private makeDevicesPlain(preDevices?: {[index: string]: any}): {[index: string]: any} {
    if (!preDevices) return {};

    const result: {[index: string]: any} = {};

    const recursively = (root: string, preDevicesOrRoom: {[index: string]: any}) => {
      if (preDevicesOrRoom.device) {
        // it's device definition
        result[root] = preDevicesOrRoom;

        return;
      }

      // else it's room - go deeper in room
      for (let itemName of Object.keys(preDevicesOrRoom)) {
        const newRoot = (root)
          ? [ root, itemName ].join(systemConfig.hostSysCfg.deviceIdSeparator)
          : itemName;
        recursively(newRoot, preDevicesOrRoom[itemName]);
      }
    };

    recursively('', preDevices);

    return result;
  }

  /**
   * Convert definition line { device: MyClass, ... } to { iclassName: MyClass, ... }
   */
  private convertDefinitions(
    type: ManifestsTypeName,
    preDefinitions: {[index: string]: any}
  ): {[index: string]: PreEntityDefinition} {
    const definitions: {[index: string]: PreEntityDefinition} = {};

    for (let id of Object.keys(preDefinitions)) {
      definitions[id] = {
        ..._omit(preDefinitions[id], type),
        className: this.getDefinitionClassName(type, id, preDefinitions[id]),
      };
    }

    return definitions;
  }

  /**
   * Generate service from shortcuts like 'automation', 'logger' etc.
   */
  private collectServicesFromShortcuts(
    preHostConfig: {[index: string]: any}
  ): {[index: string]: PreEntityDefinition} {
    const services: {[index: string]: PreEntityDefinition} = {};

    // collect services
    for (let serviceId of Object.keys(servicesShortcut)) {
      if (typeof preHostConfig[serviceId] === 'undefined') continue;

      // if it is empty then yaml parser will return null
      const definition: PreEntityDefinition = preHostConfig[serviceId] || {};

      services[serviceId] = {
        ...definition,
        className: servicesShortcut[serviceId],
      };
    }

    return services;
  }

  getDefinitionClassName(type: ManifestsTypeName, id: string, preDefinitions: PreEntityDefinition): string {
    if (type === 'driver') {
      return id;
    }

    return preDefinitions[type];
  }

}
