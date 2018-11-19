const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
const _values = require('lodash/values');
const _isEmpty = require('lodash/isEmpty');

import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import PreHostConfig from './interfaces/PreHostConfig';
import PreDeviceDefinition from './interfaces/PreDeviceDefinition';
import PreDriverDefinition from './interfaces/PreDriverDefinition';
import PreServiceDefinition from './interfaces/PreServiceDefinition';
import Main from './Main';
import {SrcEntitiesSet, SrcEntitySet} from './interfaces/EntitySet';



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
    return this.devicesDefinitions[hostId] || {};
  }

  getHostDriversDefinitions(hostId: string): {[index: string]: EntityDefinition} {
    return this.driversDefinitions[hostId] || {};
  }

  getHostServicesDefinitions(hostId: string): {[index: string]: EntityDefinition} {
    return this.servicesDefinitions[hostId] || {};
  }

  generate() {
    const hostIds: string[] = this.main.masterConfig.getHostsIds();

    for (let hostId of hostIds) {
      const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);
      const { devices, drivers, services } = this.prepareEntities(hostId, rawHostConfig);

      if (!_isEmpty(devices)) {
        this.devicesDefinitions[hostId] = devices;
      }
      if (!_isEmpty(drivers)) {
        this.driversDefinitions[hostId] = drivers;
      }
      if (!_isEmpty(services)) {
        this.servicesDefinitions[hostId] = services;
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
  private prepareEntities(hostId: string, rawHostConfig: PreHostConfig):
  {
    devices: {[index: string]: EntityDefinition},
    drivers: {[index: string]: EntityDefinition},
    services: {[index: string]: EntityDefinition}
  } {
    const devices: {[index: string]: EntityDefinition} = {};
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};
    const allHostDrivers: string[] = this.main.hostClassNames.getAllUsedDriversClassNames(hostId);

    if (rawHostConfig.devices) {
      for (let id of Object.keys(rawHostConfig.devices)) {
        devices[id] = this.generateDeviceDef(id, rawHostConfig.devices[id], rawHostConfig.devicesDefaults);
      }
    }

    // each all drivers of host include dependencies but exclude devs
    for (let entityName of allHostDrivers) {
      drivers[entityName] = this.generateDriverDef(
        entityName,
        rawHostConfig.drivers && rawHostConfig.drivers[entityName]
      );
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
    hostDeviceDefaultProps?: {[index: string]: any}
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
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
  }

  private generateDriverDef(id: string, driverDef?: PreDriverDefinition): EntityDefinition {
    // id and className is the same for drivers
    const className = id;
    const manifest = this.main.entities.getManifest('drivers', className);

    return {
      id,
      className: id,
      props: _defaultsDeep(
        _cloneDeep(_omit(driverDef, 'driver')),
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
  }

  private generateServiceDef(id: string, serviceDef: PreServiceDefinition): EntityDefinition {
    const className = serviceDef.service;
    const manifest = this.main.entities.getManifest('services', className);

    return {
      // TODO: id и className не нужны, только props
      id,
      className,
      props: _defaultsDeep(
        _cloneDeep(_omit(serviceDef, 'service')),
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
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

  private collectManifestPropsDefaults(manifestProps?: {[index: string]: any}): {[index: string]: any} {
    const result: {[index: string]: any} = {};

    if (!manifestProps) return result;

    for (let propName of Object.keys(manifestProps)) {
      result[propName] = manifestProps[propName].default;
    }

    return result;
  }

}
