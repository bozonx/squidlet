const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
const _values = require('lodash/values');

import DefinitionBase from '../host/src/app/interfaces/DefinitionBase';
import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';
import PreHostConfig from './interfaces/PreHostConfig';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import PreDeviceDefinition from './interfaces/PreDeviceDefinition';
import PreDriverDefinition from './interfaces/PreDriverDefinition';
import PreServiceDefinition from './interfaces/PreServiceDefinition';
import Main from './Main';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import systemConfig from './configs/systemConfig';
import {AllManifests} from './Entities';


const servicesShortcut = [
  'automation',
  'mqtt',
  'logger',
  'webApi',
];


/**
 * Prepare hosts devices, drivers and services definitions.
 */
export default class Definitions {
  private readonly main: Main;
  // definitions like {hostId: {entityId: Definition}}
  private devicesDefinitions: {[index: string]: {[index: string]: DeviceDefinition}} = {};
  private driversDefinitions: {[index: string]: {[index: string]: DriverDefinition}} = {};
  private servicesDefinitions: {[index: string]: {[index: string]: ServiceDefinition}} = {};


  constructor(main: Main) {
    this.main = main;
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
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.main.masterConfig.hosts;

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig: PreHostConfig = rawHostsConfigs[hostId];
      const { devices, drivers, services } = this.prepareEntities(rawHostConfig);

      if (rawHostConfig.devices) {
        this.devicesDefinitions[hostId] = this.mergeDevicesDefaults(devices, rawHostConfig.devicesDefaults);
      }
      if (rawHostConfig.drivers) {
        this.driversDefinitions[hostId] = drivers;
      }
      if (rawHostConfig.services) {
        this.servicesDefinitions[hostId] = {
          ...services,
          ...this.collectServicesFromShortcuts(rawHostConfig),
        };
      }
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
  ): {
    devices: {[index: string]: DeviceDefinition},
    drivers: {[index: string]: DriverDefinition},
    services: {[index: string]: ServiceDefinition}
  } {
    const devices: {[index: string]: DeviceDefinition} = {};
    const drivers: {[index: string]: DriverDefinition} = {};
    const services: {[index: string]: ServiceDefinition} = {};
    const plainDevices: {[index: string]: PreDeviceDefinition} = this.makeDevicesPlain(rawHostConfig.devices);

    for (let entityName of Object.keys(plainDevices)) {
      devices[entityName] = this.generateDeviceDef(entityName, plainDevices[entityName]);
    }

    if (rawHostConfig.drivers) {
      for (let entityName of Object.keys(rawHostConfig.drivers || {})) {
        drivers[entityName] = this.generateDriverDef(entityName, rawHostConfig.drivers[entityName]);
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

  private generateDriverDef(driverId: string, driverDef: PreDriverDefinition): DriverDefinition {
    return {
      id: driverId,
      className: driverId,
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
        const newRoot = (root)
          ? [ root, itemName ].join(systemConfig.hostSysCfg.deviceIdSeparator)
          : itemName;
        recursively(newRoot, preDevicesOrRoom[itemName]);
      }
    };

    recursively('', preDevices);

    return result;
  }

  private mergeDevicesDefaults(
    devices: {[index: string]: DeviceDefinition},
    devicesDefaults?: {[index: string]: any}
  ): {[index: string]: DeviceDefinition} {
    if (!devicesDefaults) return devices;

    const result: {[index: string]: DeviceDefinition} = {};

    for (let deviceId of Object.keys(devices)) {
      const deviceDefClone = _cloneDeep(devices[deviceId]);

      result[deviceId] = {
        ...deviceDefClone,
        // merge default props with entity props
        props: _defaultsDeep(deviceDefClone.props, devicesDefaults[deviceDefClone.className]),
      };
    }

    return result;
  }

  /**
   * Generate service from shortcuts like 'automation', 'logger' etc.
   */
  private collectServicesFromShortcuts(
    rawHostConfig: {[index: string]: any}
  ): {[index: string]: ServiceDefinition} {
    const services: {[index: string]: ServiceDefinition} = {};

    // collect services
    for (let serviceId of servicesShortcut) {
      const definition: PreServiceDefinition = rawHostConfig[serviceId];

      if (!definition) continue;

      services[serviceId] = this.generateServiceDef(serviceId, {
        ...definition,
        service: definition.name,
      });
    }

    return services;
  }

  /**
   * Check for definitions classNames exist in manifests.
   */
  private checkDefinitions() {
    const manifests: AllManifests = this.main.entities.getManifests();
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
