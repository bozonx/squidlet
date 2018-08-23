import DeviceConf from '../app/interfaces/DeviceConf';

const _defaultsDeep = require('lodash/defaultsDeep');

import PreServiceManifest from './interfaces/PreServiceManifest';
import ServiceDefinition from '../app/interfaces/ServiceDefinition';
import MasterConfig from './interfaces/MasterConfig';
import Manifests from './Manifests';
import HostConfig from '../app/interfaces/HostConfig';
import PreHostConfig from './interfaces/PreHostConfig';


export default class HostsConfigGenerator {
  private readonly masterConfig: MasterConfig;
  private readonly manifests: Manifests;
  // hosts configs by hostId
  private hostsConfigs: {[index: string]: HostConfig} = {};


  constructor(masterConfig: MasterConfig, manifests: Manifests) {
    this.masterConfig = masterConfig;
    this.manifests = manifests;
  }

  // TODO: !!!! add devs specified to platform

  generate() {
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.getHostsConfigs();

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig = rawHostsConfigs[hostId];
      const hostConfig: HostConfig = {
        host: this.mergeHostParams(rawHostConfig) as HostConfig['host'],
        devices: this.generateDevices(rawHostConfig.devices || {}),
        drivers: this.generateDevices(rawHostConfig.drivers || {}),
        services: this.generateServices(rawHostConfig.services || {}),
        devicesDefaults: rawHostConfig.devicesDefaults || {},
      };

      this.hostsConfigs[hostId] = hostConfig;
    }
  }

  private generateDevices(rawDevices: {[index: string]: any}): {[index: string]: DeviceConf} {
    // TODO: !!!
  }

  private generateDrivers(rawDrivers: {[index: string]: any}): {[index: string]: any} {
    // TODO: !!!
  }

  private generateServices(rawServices: {[index: string]: any}): {[index: string]: ServiceDefinition} {
    // TODO: слить props
    // TODO: сформировать service definition - вставить из манифеста что нужно

  }

  mergeHostParams(hostParams: {[index: string]: any}): {[index: string]: any} {
    return _defaultsDeep({ ...hostParams }, this.masterConfig.hostDefaults);
  }

  private getHostsConfigs(): {[index: string]: PreHostConfig} {
    if (!this.masterConfig.host || this.masterConfig.hosts) {
      throw new Error(`Master config doesn't have "host" or "hosts" params`);
    }

    let hosts: {[index: string]: PreHostConfig} = {};

    if (this.masterConfig.hosts) {
      hosts = this.masterConfig.hosts;
    }
    else if (this.masterConfig.host) {
      hosts = {
        master: this.masterConfig.host,
      };
    }

    return hosts;
  }

}
