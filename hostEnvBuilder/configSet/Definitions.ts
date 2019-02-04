import _defaultsDeep = require('lodash/defaultsDeep');
import _cloneDeep = require('lodash/cloneDeep');
import _omit = require('lodash/omit');
import _values = require('lodash/values');
import _isEmpty = require('lodash/isEmpty');

import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import EntityDefinition from '../../host/interfaces/EntityDefinition';
import PreHostConfig from '../interfaces/PreHostConfig';
import {SrcEntitiesSet, SrcEntitySet} from '../../host/interfaces/EntitySet';
import HostClassNames from './HostClassNames';
import EntitiesCollection from '../entities/EntitiesCollection';
import ConfigManager from '../ConfigManager';


/**
 * Prepare hosts devices, drivers and services definitions.
 */
export default class Definitions {
  private readonly configManager: ConfigManager;
  private readonly entitiesCollection: EntitiesCollection;
  private readonly hostClassNames: HostClassNames;
  // definitions like {hostId: {entityId: Definition}}
  private devicesDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};
  private driversDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};
  private servicesDefinitions: {[index: string]: {[index: string]: EntityDefinition}} = {};


  constructor(configManager: ConfigManager, entitiesCollection: EntitiesCollection, hostClassNames: HostClassNames) {
    this.configManager = configManager;
    this.entitiesCollection = entitiesCollection;
    this.hostClassNames = hostClassNames;
  }

  getHostDevicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.devicesDefinitions[hostId] || {};
  }

  getHostDriversDefinitions(): {[index: string]: EntityDefinition} {
    return this.driversDefinitions[hostId] || {};
  }

  getHostServicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.servicesDefinitions[hostId] || {};
  }

  generate() {
    const hostIds: string[] = this.configManager.getHostsIds();

    for (let hostId of hostIds) {
      const rawHostConfig: PreHostConfig = this.configManager.getPreHostConfig(hostId);
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
  private prepareEntities(rawHostConfig: PreHostConfig):
  {
    devices: {[index: string]: EntityDefinition},
    drivers: {[index: string]: EntityDefinition},
    services: {[index: string]: EntityDefinition}
  } {
    const devices: {[index: string]: EntityDefinition} = {};
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};
    const allHostDrivers: string[] = this.hostClassNames.getAllUsedDriversClassNames(hostId);

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
    deviceDef: PreEntityDefinition,
    hostDeviceDefaultProps?: {[index: string]: any}
  ): EntityDefinition {
    const manifest = this.entitiesCollection.getManifest('devices', deviceDef.className);
    const deviceHostDefaults: {[index: string]: any} | undefined = hostDeviceDefaultProps
      && hostDeviceDefaultProps[deviceDef.className];

    return {
      id,
      className: deviceDef.className,
      props: _defaultsDeep(
        _cloneDeep(_omit(deviceDef, 'className')),
        deviceHostDefaults,
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
  }

  /**
   * Generate definitions for all the used drivers event it doesn't have a definition.
   */
  private generateDriverDef(id: string, driverDef?: PreEntityDefinition): EntityDefinition {
    // id and className is the same for drivers
    const className = id;
    const manifest = this.entitiesCollection.getManifest('drivers', className);

    return {
      id,
      className: className,
      props: _defaultsDeep(
        _cloneDeep(_omit(driverDef, 'className')),
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
  }

  private generateServiceDef(id: string, serviceDef: PreEntityDefinition): EntityDefinition {
    const manifest = this.entitiesCollection.getManifest('services', serviceDef.className);

    return {
      id,
      className: serviceDef.className,
      props: _defaultsDeep(
        _cloneDeep(_omit(serviceDef, 'className')),
        this.collectManifestPropsDefaults(manifest.props),
      ),
    };
  }

  /**
   * Check for definitions classNames exist in manifests.
   */
  private checkDefinitions() {
    const entities: SrcEntitiesSet = this.entitiesCollection.getEntitiesSet();
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
      if (!manifestProps[propName] || typeof manifestProps[propName].default === 'undefined') continue;

      result[propName] = manifestProps[propName].default;
    }

    return result;
  }

}
