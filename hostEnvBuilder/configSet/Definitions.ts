import _defaultsDeep = require('lodash/defaultsDeep');
import _omit = require('lodash/omit');
import _isEmpty = require('lodash/isEmpty');

import EntityDefinition, {EntitiesDefinitions} from '../../host/interfaces/EntityDefinition';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import {SrcEntitySet} from '../interfaces/SrcEntitiesSet';
import ConfigManager from '../ConfigManager';
import UsedEntities, {EntitiesNames} from '../entities/UsedEntities';


/**
 * Prepare hosts devices, drivers and services definitions.
 */
export default class Definitions {
  private readonly configManager: ConfigManager;
  private readonly usedEntities: UsedEntities;
  // definitions like {entityId: Definition}
  private devicesDefinitions: {[index: string]: EntityDefinition} = {};
  private driversDefinitions: {[index: string]: EntityDefinition} = {};
  private servicesDefinitions: {[index: string]: EntityDefinition} = {};


  constructor(configManager: ConfigManager, usedEntities: UsedEntities) {
    this.configManager = configManager;
    this.usedEntities = usedEntities;
  }


  getHostDevicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.devicesDefinitions;
  }

  getHostDriversDefinitions(): {[index: string]: EntityDefinition} {
    return this.driversDefinitions;
  }

  getHostServicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.servicesDefinitions;
  }

  generate() {
    const { devices, drivers, services } = this.prepareEntities();

    if (!_isEmpty(devices)) this.devicesDefinitions = devices;

    if (!_isEmpty(drivers)) this.driversDefinitions = drivers;

    if (!_isEmpty(services)) this.servicesDefinitions = services;
  }


  /**
   * Make definitions of all the used entities of host
   */
  private prepareEntities(): EntitiesDefinitions {
    const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();
    const devices: {[index: string]: EntityDefinition} = {};
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};

    // make devices
    if (this.configManager.preHostConfig.devices) {
      for (let id of Object.keys(this.configManager.preHostConfig.devices)) {
        devices[id] = this.generateDeviceDef(id);
      }
    }

    // make each all drivers of host include dependencies but exclude devs
    for (let entityName of usedEntitiesNames.drivers) {
      drivers[entityName] = this.generateDriverDef(entityName);
    }

    // make services
    if (this.configManager.preHostConfig.services) {
      for (let entityName of Object.keys(this.configManager.preHostConfig.services)) {
        services[entityName] = this.generateServiceDef(entityName);
      }
    }

    return {
      devices,
      drivers,
      services,
    };
  }

  private generateDeviceDef(id: string): EntityDefinition {
    if (!this.configManager.preHostConfig.devices) {
      throw new Error(`Can't find definition of device "${id}"`);
    }

    const deviceDef: {[index: string]: any} = this.configManager.preHostConfig.devices[id];
    const hostDeviceDefaultProps = this.configManager.preHostConfig.devicesDefaults;
    const className: string = deviceDef.className;
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('devices', className);
    const deviceHostDefaults: {[index: string]: any} | undefined = hostDeviceDefaultProps
      && hostDeviceDefaultProps[className];

    return {
      id,
      className,
      props: _defaultsDeep(
        // definition
        _omit(deviceDef, 'className'),
        // host's defaults
        deviceHostDefaults,
        // manifest's defaults
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  /**
   * Generate definitions for all the used drivers even it doesn't have a definition.
   */
  private generateDriverDef(className: string): EntityDefinition {
    const driverDef: PreEntityDefinition | undefined = this.configManager.preHostConfig.drivers
      && this.configManager.preHostConfig.drivers[className];
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('drivers', className);

    return {
      // id and className is the same for drivers
      id: className,
      className: className,
      props: _defaultsDeep(
        _omit(driverDef, 'className'),
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  private generateServiceDef(id: string): EntityDefinition {
    if (!this.configManager.preHostConfig.services) {
      throw new Error(`Can't find definition of services "${id}"`);
    }

    const serviceDef: PreEntityDefinition = this.configManager.preHostConfig.services[id];
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('services', serviceDef.className);

    return {
      id,
      className: serviceDef.className,
      props: _defaultsDeep(
        _omit(serviceDef, 'className'),
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
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
