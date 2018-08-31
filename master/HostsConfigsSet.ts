const _defaultsDeep = require('lodash/defaultsDeep');
const _omit = require('lodash/omit');

import DefinitionBase from '../host/src/app/interfaces/DefinitionBase';
import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';
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
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.main.masterConfigHosts;

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig: PreHostConfig = rawHostsConfigs[hostId];

      if (rawHostConfig.devices) {
        this.devicesDefinitions[hostId] = this.collectDevicesDefinitions(
          rawHostConfig.devices,
          rawHostConfig.devicesDefaults
        );
      }
      if (rawHostConfig.drivers) {

        // TODO: у драйверов id - это name

        this.driversDefinitions[hostId] = this.collectDriversDefinitions(rawHostConfig.drivers);
      }
      if (rawHostConfig.services) {
        this.servicesDefinitions[hostId] = {
          ...this.collectServicesDefinitions(rawHostConfig.services),
          ...this.collectServicesFromShortcuts(rawHostConfig),
        };
      }

      // final host config
      this.hostsConfigs[hostId] = this.generateHostConfig(rawHostConfig);
    }
  }


  private collectDevicesDefinitions(
    rawDevices: {[index: string]: PreDeviceDefinition},
    devicesDefaults?: {[index: string]: any}
  ): {[index: string]: DeviceDefinition} {
    return this.generateEntityDefinition<DeviceDefinition>(
      rawDevices,
      'device',
      (entityId: string, entityDef: DeviceDefinition): DeviceDefinition => {
        return {
          ...entityDef,
          // merge default props with entity props
          props: {
            ...devicesDefaults,
            ...entityDef.props,
          }
        };
      }
    );
  }

  private collectDriversDefinitions(
    rawDrivers: {[index: string]: PreDriverDefinition}
  ): {[index: string]: DriverDefinition} {
    return this.generateEntityDefinition<DriverDefinition>(rawDrivers, 'driver');
  }

  private collectServicesDefinitions(
    rawServices: {[index: string]: PreServiceDefinition}
  ): {[index: string]: ServiceDefinition} {
    return this.generateEntityDefinition<ServiceDefinition>(rawServices, 'service');
  }

  private generateEntityDefinition<T extends DefinitionBase>(
    rawDefinitions: {[index: string]: any},
    classNameParam: string,
    transform?: (entityId: string, entityDef: T) => T
  ): {[index: string]: T} {
    const result: {[index: string]: T} = {};

    for (let entityId of Object.keys(rawDefinitions)) {
      const entityDef: {[index: string]: any} = rawDefinitions[entityId];

      result[entityId] = {
        id: entityId,
        className: entityDef[classNameParam],
        props: _omit(entityDef, classNameParam),
      } as T;

      if (transform) result[entityId] = transform(entityId, result[entityId]);
    }

    return result;
  }

  /**
   * Generate service from shortcuts like 'automation', 'logger' etc.
   */
  private collectServicesFromShortcuts(
    rawHostConfig: {[index: string]: any}
  ): {[index: string]: ServiceDefinition} {
    const rawServices: {[index: string]: PreServiceDefinition} = {};

    // collect services
    for (let serviceId of servicesShortcut) {
      const definition: PreServiceDefinition = rawHostConfig[serviceId];

      if (!definition) continue;

      rawServices[serviceId] = {
        service: serviceId,
        ...rawHostConfig[serviceId]
      };
    }

    return this.generateEntityDefinition<ServiceDefinition>(rawServices, 'service');
  }

  private generateHostConfig(rawHostConfig: PreHostConfig) {
    return {
      platform: rawHostConfig.platform,
      host: this.mergeHostParams(rawHostConfig) as HostConfig['host'],
    };
  }

  /**
   * Merge params of host.
   */
  private mergeHostParams(rawHostConfig: PreHostConfig): {[index: string]: any} {
    // TODO: смержить ещё с configHostDefault.ts конфигом где указан дефолтный storeDir и тд
    // TODO: смержить ещё с platform config
    // TODO: добавить connection driver и его зависимые драйверы которые используются в network

    return _defaultsDeep(
      { ...rawHostConfig.host },
      this.main.masterConfig.hostDefaults
    );
  }

}
