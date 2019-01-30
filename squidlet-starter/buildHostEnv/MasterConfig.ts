import * as path from 'path';
import _omit = require('lodash/omit');
import _defaultsDeep = require('lodash/defaultsDeep');
import _cloneDeep = require('lodash/cloneDeep');

import {ManifestsTypeName} from '../../squidlet-core/core/interfaces/ManifestTypes';
import PreMasterConfig from './interfaces/PreMasterConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import systemConfig from './configs/systemConfig';
import validateMasterConfig from './validateMasterConfig';
import HostConfig from '../../squidlet-core/core/interfaces/HostConfig';
import hostDefaultConfig from './configs/hostDefaultConfig';
import Platforms, {
  PLATFORM_ESP32,
  PLATFORM_ESP8266,
  PLATFORM_RPI,
  PLATFORM_X86
} from './interfaces/Platforms';
import PlatformConfig from './interfaces/PlatformConfig';
import platform_esp32 from '../../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../../platforms/squidlet-x86/platform_x86_linux';
import PreEntityDefinition from './interfaces/PreEntityDefinition';
import {appendArray} from './helpers';
import Io from './Io';


// TODO: move to build helpers ???
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
  private readonly io: Io;
  readonly plugins: string[] = [];
  get buildDir(): string {
    return this._buildDir as string;
  }

  private readonly hostDefaults: {[index: string]: any} = {};
  // unprocessed hosts configs
  private readonly preHosts: {[index: string]: PreHostConfig} = {};
  // storage base dir
  private _buildDir?: string;
  // absolute path to master config yaml
  private readonly masterConfigPath: string;
  // specified build dir by arguments of command
  private readonly argBuildDir?: string;


  constructor(io: Io, masterConfigPath: string, argBuildDir?: string) {
    this.io = io;
    this.masterConfigPath = masterConfigPath;
    this.argBuildDir = argBuildDir;
  }

  async init() {
    const masterConfig: PreMasterConfig = await this.io.loadYamlFile(this.masterConfigPath);
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    const preHostsConfigs: {[index: string]: PreHostConfig} = this.resolveHosts(masterConfig);

    appendArray(this.plugins, masterConfig.plugins);
    _defaultsDeep(this.hostDefaults, masterConfig.hostDefaults);
    _defaultsDeep(this.preHosts, this.generatePreHosts(preHostsConfigs));
    this._buildDir = this.resolveBuildDir();
  }


  getHostsIds(): string[] {
    return Object.keys(this.preHosts);
  }

  // TODO: does it really need ???
  getPreHostConfig(hostId: string): PreHostConfig {
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.preHosts[hostId];
  }

  getFinalHostConfig(hostId: string): HostConfig {
    if (!this.preHosts[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.prepareHostConfig(hostId);
  }

  // TODO: review
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

  private resolveBuildDir(): string {

    // TODO: review

    // use command argument if specified
    if (this.argBuildDir) return this.argBuildDir;

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
        return path.resolve(path.dirname(this.masterConfigPath), storageDir);
      }
    }

    // use default build dir
    return systemConfig.defaultBuildDir;
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
