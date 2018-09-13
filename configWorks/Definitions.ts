import {SrcEntitiesSet} from './interfaces/EntitySet';

const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
const _values = require('lodash/values');

import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import PreHostConfig from './interfaces/PreHostConfig';
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
  private devicesDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};
  private driversDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};
  private servicesDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};


  constructor(main: Main) {
    this.main = main;
  }

  getHostDevicesDefinitions(hostId: string): {[index: string]: EntityDefinition} {
    return this.devicesDefinitions[hostId];
  }

  getHostDriversDefinitions(hostId: string): {[index: string]: EntityDefinition} {
    return this.driversDefinitions[hostId];
  }

  getHostServicesDefinitions(hostId: string): {[index: string]: EntityDefinition} {
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
    devices: {[index: string]: EntityDefinition},
    drivers: {[index: string]: EntityDefinition},
    services: {[index: string]: EntityDefinition}
  } {
    const devices: {[index: string]: EntityDefinition} = {};
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};
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

  private generateDeviceDef(deviceId: string, deviceDef: PreDeviceDefinition): EntityDefinition {
    return {
      id: deviceId,
      className: deviceDef.device,
      props: {
        ..._omit(deviceDef, 'device'),
        // double of id
        id: deviceId,
      },
    };
  }

  private generateDriverDef(driverId: string, driverDef: PreDriverDefinition): EntityDefinition {
    return {
      id: driverId,
      className: driverId,
      props: {
        ...driverDef,
        // double of id
        id: driverId,
      },
    };
  }

  private generateServiceDef(serviceId: string, serviceDef: PreServiceDefinition): EntityDefinition {
    return {
      id: serviceId,
      className: serviceDef.service,
      props: {
        ..._omit(serviceDef, 'service'),
        // double of id
        id: serviceId,
      },
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
    devices: {[index: string]: EntityDefinition},
    devicesDefaults?: {[index: string]: any}
  ): {[index: string]: EntityDefinition} {
    if (!devicesDefaults) return devices;

    const result: {[index: string]: EntityDefinition} = {};

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
  ): {[index: string]: EntityDefinition} {
    const services: {[index: string]: EntityDefinition} = {};

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
    const entities: SrcEntitiesSet = this.main.entities.getEntitiesSet();
    const check = (
      entitiesOfType: {[index: string]: SrcEntitiesSet},
      definitions: {[index: string]: {[index: string]: EntityDefinition}}
    ) => {
      for(let hostId of Object.keys(definitions)) {
        for (let entityDef of _values(definitions[hostId])) {
          if (!entitiesOfType[entityDef.className]) {
            throw new Error(`Can't find an entity "${entityDef.className}" of definition ${JSON.stringify(entityDef)}`);
          }
        }
      }
    };

    check(entities.devices, this.devicesDefinitions);
    check(entities.drivers, this.driversDefinitions);
    check(entities.services, this.servicesDefinitions);
  }

}
