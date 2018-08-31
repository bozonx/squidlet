import DefinitionBase from '../host/src/app/interfaces/DefinitionBase';

const _defaultsDeep = require('lodash/defaultsDeep');
const _omit = require('lodash/omit');

import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';
import MasterConfig from './interfaces/MasterConfig';
import Manifests from './Manifests';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import PreDeviceDefinition from './interfaces/PreDeviceDefinition';
import PreDriverDefinition from './interfaces/PreDriverDefinition';
import PreServiceDefinition from './interfaces/PreServiceDefinition';


const servicesShortcut = [
  'automation',
  'mqtt',
  'logger',
  'webApi',
];


// TODO: rename

export default class HostsConfigsSet {
  private readonly masterConfig: MasterConfig;
  private readonly manifests: Manifests;
  // hosts configs by hostId
  private hostsConfigs: {[index: string]: HostConfig} = {};


  constructor(masterConfig: MasterConfig, manifests: Manifests) {
    this.masterConfig = masterConfig;
    this.manifests = manifests;
  }

  getHostsIds(): string[] {
    // TODO: !!!
  }

  getHostConfig(hostId: string): HostConfig {
    // TODO: !!!
  }

  getHostsConfig(): {[index: string]: HostConfig} {

    // TODO: clone or immutable

    return this.hostsConfigs;
  }

  generate() {
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.getHostsConfigs();


    //
    // TODO: смержить конфиг платформы
    // TODO: смержить props
    // TODO: добавить connection driver и его зависимые драйверы которые используются в network


    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig = rawHostsConfigs[hostId];
      const hostConfig: HostConfig = {
        platform: rawHostConfig.platform,
        host: this.mergeHostParams(rawHostConfig) as HostConfig['host'],
        devices: this.generateDevices(rawHostConfig.devices || {}),
        drivers: this.generateDrivers(rawHostConfig.drivers || {}),
        services: {
          ...this.generateServices(rawHostConfig.services || {}),
          ...this.generatePreDefinedServices(rawHostConfig),
        },
        devicesDefaults: rawHostConfig.devicesDefaults || {},
      };

      this.hostsConfigs[hostId] = hostConfig;
    }
  }

  getDevicesDefinitions(hostId: string): {[index: string]: DeviceDefinition} {
    // TODO: !!!!
  }

  getDriversDefinitions(hostId: string): {[index: string]: DriverDefinition} {
    // TODO: !!!!
  }

  getServicesDefinitions(hostId: string): {[index: string]: ServiceDefinition} {
    // TODO: !!!!
  }

  /**
   * Merge params of host with hostDefaults.
   * @param hostParams
   */
  private mergeHostParams(hostParams: {[index: string]: any}): {[index: string]: any} {

    // TODO: смержить ещё с захардкоженным default конфигом где указан дефолтный storeDir и тд
    // TODO: смержить ещё с platform config

    return _defaultsDeep({ ...hostParams }, this.masterConfig.hostDefaults);
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


        // TODO: ??? отсортировать для каждого хоста - сначала dev, потом system потом остальные

        props: _omit(rawDrivers[driverId], 'driver'),
      };

      definitions.push(driver);
    }

    return definitions;
  }

  private generateServices(rawServices: {[index: string]: PreServiceDefinition}): ServiceDefinition[] {
    const definitions: ServiceDefinition[] = [];

    for (let serviceId of Object.keys(rawServices)) {
      const service: ServiceDefinition = this.makeServiceDefinition(serviceId, rawServices[serviceId]);

      definitions.push(service);
    }

    return definitions;
  }

  /**
   * Generate service from shortcuts like 'automation', 'logger' etc.
   */
  private generatePreDefinedServices(rawHostConfig: {[index: string]: any}): ServiceDefinition[] {
    const result: ServiceDefinition[] = [];

    for (let serviceId of servicesShortcut) {
      const shortcut = rawHostConfig[serviceId];

      if (shortcut) {
        const serviceDefinition: ServiceDefinition = this.makeServiceDefinition(serviceId, shortcut);

        result.push(serviceDefinition);
      }
    }

    return result;
  }

  makeServiceDefinition(serviceId: string, preService: PreServiceDefinition): ServiceDefinition {
    return {
      id: serviceId,
      className: preService.service,
      props: _omit(preService, 'service'),
    };
  }

  /**
   * Use "hosts" of {master: host} params of master config.
   */
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


  private generateDefinitions<T extends DefinitionBase>(
    definitions: {[index: string]: T}
  ): {[index: string]: T} {
    const result: {[index: string]: T} = {};

    for (let id of Object.keys(definitions)) {
      const definiton: T = definitions[id];

      result[id] = {
        ...definiton as object,
        props: {
          ...definiton.props,
          // TODO: manifest props
        },
      } as T;
    }


    return result;
  }

}


// private mergeProps(
//   className: string,
//   instanceProps: {[index: string]: any},
// manifestProps?: {[index: string]: any}
// ): {[index: string]: any} {
//   return {
//     // default props from device's manifest
//     ...manifestProps,
//     // default props from config.devicesDefaults
//     ...this.system.host.config.devicesDefaults && this.system.host.config.devicesDefaults[className],
//     // specified props for certain instance
//     ...instanceProps,
//   };
// }
