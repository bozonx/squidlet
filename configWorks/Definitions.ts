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
import systemConfig from './configs/systemConfig';
import {SrcEntitiesSet, SrcEntitySet} from './interfaces/EntitySet';


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
    const hostIds: string[] = this.main.masterConfig.getHostsIds();

    for (let hostId of hostIds) {
      const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);
      const { devices, drivers, services } = this.prepareEntities(rawHostConfig);

      if (rawHostConfig.devices) {
        this.devicesDefinitions[hostId] = devices;
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
  private prepareEntities(rawHostConfig: PreHostConfig):
  {
    devices: {[index: string]: EntityDefinition},
    drivers: {[index: string]: EntityDefinition},
    services: {[index: string]: EntityDefinition}
  } {
    const devices: {[index: string]: EntityDefinition} = {};
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};
    const plainDevices: {[index: string]: PreDeviceDefinition} = this.makeDevicesPlain(rawHostConfig.devices);

    for (let id of Object.keys(plainDevices)) {
      devices[id] = this.generateDeviceDef(id, plainDevices[id], rawHostConfig.devicesDefaults);
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

  private generateDeviceDef(
    id: string,
    deviceDef: PreDeviceDefinition,
    hostDeviceDefaultProps: {[index: string]: any} | undefined
  ): EntityDefinition {
    const className = deviceDef.device;
    const manifest = this.main.entities.getManifest('devices', className);
    const deviceHostDefaults: {[index: string]: any} | undefined = hostDeviceDefaultProps && hostDeviceDefaultProps[className];

    return {
      id,
      className,
      props: _defaultsDeep(
        _cloneDeep(_omit(deviceDef, 'device')),
        deviceHostDefaults,
        manifest.props,
      ),
    };
  }

  private generateDriverDef(id: string, driverDef: PreDriverDefinition): EntityDefinition {
    const className = driverDef.driver;
    const manifest = this.main.entities.getManifest('drivers', className);

    return {
      id,
      className: id,
      props: _defaultsDeep(
        _cloneDeep(_omit(driverDef, 'driver')),
        manifest.props,
      ),
    };
  }

  private generateServiceDef(id: string, serviceDef: PreServiceDefinition): EntityDefinition {
    const className = serviceDef.service;
    const manifest = this.main.entities.getManifest('services', className);

    return {
      id,
      className,
      props: _defaultsDeep(
        _cloneDeep(_omit(serviceDef, 'service')),
        manifest.props,
      ),
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
      entitiesOfType: {[index: string]: SrcEntitySet},
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
