import {AllManifests} from './Manifests';

const _defaultsDeep = require('lodash/defaultsDeep');
const _omit = require('lodash/omit');
const _values = require('lodash/values');

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
import hostDefaultConfig from './configs/hostDefaultConfig';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import systemConfig from './configs/systemConfig';


interface PreparedEntity {
  id: string;
  className: string;
  [index: string]: any;
}

type PreparedEntities = {[index: string]: PreparedEntity};

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
      const { devices, drivers, services } = this.prepareEntities(rawHostConfig);

      if (rawHostConfig.devices) {
        // TODO: merge props with defaults
        // this.devicesDefinitions[hostId] = this.collectDevicesDefinitions(
        //   rawHostConfig.devices,
        //   rawHostConfig.devicesDefaults
        // );
      }
      if (rawHostConfig.drivers) {
        //this.driversDefinitions[hostId] = this.collectDriversDefinitions(rawHostConfig.drivers);
        this.driversDefinitions[hostId] = drivers;
      }
      if (rawHostConfig.services) {
        this.servicesDefinitions[hostId] = {
          //...this.collectServicesDefinitions(rawHostConfig.services),
          ...services,
          ...this.collectServicesFromShortcuts(rawHostConfig),
        };
      }

      // final host config
      this.hostsConfigs[hostId] = this.generateHostConfig(rawHostConfig);
    }

    // check for definition have a manifest
    this.checkDefinitions();
  }


  /**
   * First step of preparing - makes className and id params to all the entities
   * and makes devices plain.
   * And makes props
   */
  private prepareEntities(
    rawHostConfig: PreHostConfig
  ): { devices: PreparedEntities, drivers: PreparedEntities, services: PreparedEntities } {
    const devices: PreparedEntities = {};
    const drivers: PreparedEntities = {};
    const services: PreparedEntities = {};
    const plainDevices: {[index: string]: PreDeviceDefinition} = this.makeDevicesPlain(rawHostConfig.devices);

    for (let entityName of Object.keys(plainDevices.devices)) {
      devices[entityName] = this.generateDeviceDef(entityName, plainDevices[entityName])
    }

    if (rawHostConfig.drivers) {
      for (let entityName of Object.keys(rawHostConfig.drivers || {})) {
        drivers[entityName] = this.generateDriverDef(rawHostConfig.drivers[entityName]);
      }
    }

    if (rawHostConfig.services) {
      for (let entityName of Object.keys(rawHostConfig.services || {})) {
        services[entityName] = this.generateServiceDef(entityName, rawHostConfig.services[entityName]);
      }
    }

    return {
      devices,
      drivers,
      services,
    };
  }

  private generateDeviceDef(deviceId: string, deviceDef: PreDeviceDefinition): DeviceDefinition {
    return {
      id: deviceId,
      className: deviceDef.device,
      props: _omit(deviceDef, 'device'),
    };
  }

  private generateDriverDef(driverDef: PreDriverDefinition): DriverDefinition {
    return {
      id: driverDef.name,
      className: driverDef.name,
      props: driverDef,
    };
  }

  private generateServiceDef(serviceId: string, serviceDef: PreServiceDefinition): ServiceDefinition {
    return {
      id: serviceId,
      className: serviceDef.service,
      props: _omit(serviceDef, 'service'),
    };
  }

  private makeDevicesPlain(preDevices?: {[index: string]: any}): {[index: string]: PreDeviceDefinition} {
    if (!preDevices) return {};

    const result: {[index: string]: PreDeviceDefinition} = {};

    const recursively = (root: string, preDevicesOrRoom: {[index: string]: any}) => {
      if (preDevicesOrRoom.device) {
        // it's device definition
        result[root] = preDevicesOrRoom as PreDeviceDefinition;

        return;
      }

      // else it's room - go deeper in room
      for (let itemName of Object.keys(preDevicesOrRoom)) {
        const newRoot = [ root, itemName ].join(systemConfig.hostSysCfg.deviceIdSeparator);
        recursively(newRoot, preDevicesOrRoom[itemName]);
      }
    };

    recursively('', preDevices);

    return result;
  }

  // private collectDevicesDefinitions(
  //   rawDevices: {[index: string]: PreDeviceDefinition},
  //   devicesDefaults?: {[index: string]: any}
  // ): {[index: string]: DeviceDefinition} {
  //   return this.generateEntityDefinition<DeviceDefinition>(
  //     rawDevices,
  //     'device',
  //     (entityId: string, entityDef: DeviceDefinition): DeviceDefinition => {
  //       return {
  //         ...entityDef,
  //         // merge default props with entity props
  //         props: {
  //           ...devicesDefaults,
  //           ...entityDef.props,
  //         }
  //       };
  //     }
  //   );
  // }
  //
  // private collectDriversDefinitions(
  //   // TODO: нет поля driver - нужно добавить сначала и назвать - className
  //
  //   rawDrivers: {[index: string]: PreDriverDefinition}
  // ): {[index: string]: DriverDefinition} {
  //   return this.generateEntityDefinition<DriverDefinition>(rawDrivers, 'driver');
  // }
  //
  // private collectServicesDefinitions(
  //   rawServices: {[index: string]: PreServiceDefinition}
  // ): {[index: string]: ServiceDefinition} {
  //   return this.generateEntityDefinition<ServiceDefinition>(rawServices, 'service');
  // }

  // private generateEntityDefinition<T extends DefinitionBase>(
  //   rawDefinitions: {[index: string]: any},
  //   classNameParam: string,
  //   transform?: (entityId: string, entityDef: T) => T
  // ): {[index: string]: T} {
  //   const result: {[index: string]: T} = {};
  //
  //   for (let entityId of Object.keys(rawDefinitions)) {
  //     const entityDef: {[index: string]: any} = rawDefinitions[entityId];
  //
  //     result[entityId] = {
  //       id: entityId,
  //       className: entityDef[classNameParam],
  //       props: _omit(entityDef, classNameParam),
  //     } as T;
  //
  //     if (transform) result[entityId] = transform(entityId, result[entityId]);
  //   }
  //
  //   return result;
  // }

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

    // TODO: remake

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
    // TODO: смержить ещё с platform config

    return _defaultsDeep(
      { ...rawHostConfig.host },
      this.main.masterConfig.hostDefaults,
      hostDefaultConfig
    );
  }

  /**
   * Check for definitions classNames exist in manifests.
   */
  private checkDefinitions() {
    const manifests: AllManifests = this.main.manifests.getManifests();
    const check = (
      manifests: {[index: string]: ManifestBase},
      definitions: {[index: string]: {[index: string]:DefinitionBase}}
    ) => {
      for(let hostId of Object.keys(definitions)) {
        for (let entityDef of _values(definitions[hostId])) {
          if (!manifests[entityDef.className]) {
            throw new Error(`Can't find a manifest "${entityDef.className}" of definition ${JSON.stringify(entityDef)}`);
          }
        }
      }
    };

    check(manifests.devices, this.devicesDefinitions);
    check(manifests.drivers, this.driversDefinitions);
    check(manifests.services, this.servicesDefinitions);
  }

}
