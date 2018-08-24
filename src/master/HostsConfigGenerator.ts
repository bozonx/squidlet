const _defaultsDeep = require('lodash/defaultsDeep');
const _omit = require('lodash/omit');

import DeviceDefinition from '../app/interfaces/DeviceDefinition';
import PreServiceManifest from './interfaces/PreServiceManifest';
import ServiceDefinition from '../app/interfaces/ServiceDefinition';
import MasterConfig from './interfaces/MasterConfig';
import Manifests from './Manifests';
import HostConfig from '../app/interfaces/HostConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import DriverDefinition from '../app/interfaces/DriverDefinition';
import PreDeviceDefinition from './interfaces/PreDeviceDefinition';
import PreDriverDefinition from './interfaces/PreDriverDefinition';
import PreServiceDefinition from './interfaces/PreServiceDefinition';


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
        drivers: this.generateDrivers(rawHostConfig.drivers || {}),
        services: this.generateServices(rawHostConfig.services || {}),
        devicesDefaults: rawHostConfig.devicesDefaults || {},
      };

      this.hostsConfigs[hostId] = hostConfig;
    }
  }

  private generateDevices(rawDevices: {[index: string]: PreDeviceDefinition}): DeviceDefinition[] {
    const definitions: DeviceDefinition[] = [];

    for (let deviceId of Object.keys(rawDevices)) {
      const device: DeviceDefinition = {
        id: deviceId,
        className: rawDevices[deviceId].device,

        // TODO: merge with devicesDefaults

        props: _omit(rawDevices[deviceId], 'device'),
      };

      definitions.push(device);
    }

    return definitions;
  }

  private generateDrivers(rawDrivers: {[index: string]: PreDriverDefinition}): DriverDefinition[] {
    const definitions: DriverDefinition[] = [];

    for (let driverId of Object.keys(rawDrivers)) {
      const driver: DriverDefinition = {
        id: driverId,
        className: rawDrivers[driverId].driver,


        // TODO: отсортировать для каждого хоста - сначала dev, потом system потом остальные

        props: _omit(rawDrivers[driverId], 'driver'),
      };

      definitions.push(driver);
    }

    return definitions;
  }

  private generateServices(rawServices: {[index: string]: PreServiceDefinition}): ServiceDefinition[] {
    const definitions: ServiceDefinition[] = [];

    for (let serviceId of Object.keys(rawServices)) {
      const service: ServiceDefinition = {
        id: serviceId,
        className: rawServices[serviceId].service,
        props: _omit(rawServices[serviceId], 'service'),
      };

      definitions.push(service);
    }

    return definitions;
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
