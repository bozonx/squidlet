const _defaultsDeep = require('lodash/defaultsDeep');
const _omit = require('lodash/omit');

import DefinitionBase from '../host/src/app/interfaces/DefinitionBase';
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
import Main from './Main';


const servicesShortcut = [
  'automation',
  'mqtt',
  'logger',
  'webApi',
];


/**
 * Parse prepare hosts configs.
 */
export default class HostsConfigsSet {
  private readonly main: Main;
  // hosts configs by hostId
  private hostsConfigs: {[index: string]: HostConfig} = {};
  // definitions like {hostId: {entityId: Definition}}
  private devicesDefinitions: {[index: string]: {[index: string]: DeviceDefinition}} = {};
  private driversDefinitions: {[index: string]: {[index: string]: DriverDefinition}} = {};
  private servicesDefinitions: {[index: string]: {[index: string]: ServiceDefinition}} = {};


  constructor(main: Main) {
    this.main = main;
  }

  getHostsIds(): string[] {
    return Object.keys(this.hostsConfigs);
  }

  getHostConfig(hostId: string): HostConfig {
    if (!this.hostsConfigs[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.hostsConfigs[hostId];
  }

  getHostsConfigs(): {[index: string]: HostConfig} {
    return this.hostsConfigs;
  }

  getHostDevicesDefinitions(hostId: string): {[index: string]: DeviceDefinition} {
    return this.devicesDefinitions[hostId];
  }

  getHostDriversDefinitions(hostId: string): {[index: string]: DriverDefinition} {
    return this.driversDefinitions[hostId];
  }

  getHostServicesDefinitions(hostId: string): {[index: string]: ServiceDefinition} {
    return this.servicesDefinitions[hostId];
  }

  generate() {
    // TODO: переделать получение конфигов
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.getHostsConfigs111();

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig: PreHostConfig = rawHostsConfigs[hostId];

      if (rawHostConfig.devices) {
        this.devicesDefinitions[hostId] = this.collectDevicesDefinitions(rawHostConfig.devices);
      }
      if (rawHostConfig.drivers) {
        this.driversDefinitions[hostId] = this.collectDriversDefinitions(rawHostConfig.drivers);
      }
      if (rawHostConfig.services) {
        this.servicesDefinitions[hostId] = this.collectServicesDefinitions(rawHostConfig.services);
      }

      // final host config
      this.hostsConfigs[hostId] = this.generateHostConfig(rawHostConfig);
    }
  }

  /**
   * Merge params of host with hostDefaults.
   * @param hostParams
   */
  private mergeHostParams(hostParams: {[index: string]: any}): {[index: string]: any} {
    // TODO: смержить ещё с configHostDefault.ts конфигом где указан дефолтный storeDir и тд
    // TODO: смержить ещё с platform config

    return _defaultsDeep({ ...hostParams }, this.masterConfig.hostDefaults);
  }

  private collectDevicesDefinitions(
    rawDevices: {[index: string]: PreDeviceDefinition}
  ): {[index: string]: DeviceDefinition} {
    // TODO: use devicesDefaults: rawHostConfig.devicesDefaults || {},

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

  private collectDriversDefinitions(
    rawDrivers: {[index: string]: PreDriverDefinition}
  ): {[index: string]: DriverDefinition} {
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

  private collectServicesDefinitions(
    rawServices: {[index: string]: PreServiceDefinition}
  ): {[index: string]: ServiceDefinition} {
    // TODO: ...this.generatePreDefinedServices(rawHostConfig),


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


  private generateHostConfig(rawHostConfig: PreHostConfig) {
    return {
      platform: rawHostConfig.platform,
      host: this.mergeHostParams(rawHostConfig) as HostConfig['host'],
    };
  }


  /**
   * Use "hosts" or {master: host} params of master config.
   */
  private getHostsConfigs111(): {[index: string]: PreHostConfig} {
    // TODO: смержить конфиг платформы
    // TODO: добавить connection driver и его зависимые драйверы которые используются в network
    // TODO: наверное вынести в main

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
