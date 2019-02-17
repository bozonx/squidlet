import _defaultsDeep = require('lodash/defaultsDeep');
import _omit = require('lodash/omit');
import _values = require('lodash/values');
import _isEmpty = require('lodash/isEmpty');

import EntityDefinition, {EntitiesDefinitions} from '../../host/interfaces/EntityDefinition';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import SrcEntitiesSet, {SrcEntitySet} from '../interfaces/SrcEntitiesSet';
import ConfigManager from '../ConfigManager';
import UsedEntities from '../entities/UsedEntities';
import {EntitiesNames} from '../entities/EntitiesCollection';


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

    // check for definition have a manifest
    this.checkDefinitions();
  }


  /**
   * Make definitions of all the used entities of host
   */
  private prepareEntities(): EntitiesDefinitions {
    const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();
    const devices: {[index: string]: EntityDefinition} = {};
      // usedEntitiesNames.devices
      // .map<EntitiesDefinitions>((id: string) => this.generateDeviceDef(id));
    const drivers: {[index: string]: EntityDefinition} = {};
    const services: {[index: string]: EntityDefinition} = {};

    // TODO: наверное и all devices class names

    //const allHostDrivers: string[] = this.hostClassNames.getAllUsedDriversClassNames();

    for (let id of usedEntitiesNames.devices) {
      devices[id] = this.generateDeviceDef(id);
    }

    // if (this.configManager.preHostConfig.devices) {
    //   for (let id of Object.keys(this.configManager.preHostConfig.devices)) {
    //     devices[id] = this.generateDeviceDef(
    //       id,
    //       this.configManager.preHostConfig.devices[id],
    //       this.configManager.preHostConfig.devicesDefaults
    //     );
    //   }
    // }

    // each all drivers of host include dependencies but exclude devs
    for (let entityName of allHostDrivers) {
      drivers[entityName] = this.generateDriverDef(
        entityName,
        this.configManager.preHostConfig.drivers && this.configManager.preHostConfig.drivers[entityName]
      );
    }

    if (this.configManager.preHostConfig.services) {
      for (let entityName of Object.keys(this.configManager.preHostConfig.services || {})) {
        services[entityName] = this.generateServiceDef(entityName, this.configManager.preHostConfig.services[entityName]);
      }
    }

    return {
      devices,
      drivers,
      services,
    };
  }

  private generateDeviceDef(id: string): EntityDefinition {
    const deviceDef: {[index: string]: any} | undefined = this.configManager.preHostConfig.devices[id];
    const hostDeviceDefaultProps = this.configManager.preHostConfig.devicesDefaults;
    const className: string = deviceDef.className;

    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('devices', className);
    const deviceHostDefaults: {[index: string]: any} | undefined = hostDeviceDefaultProps
      && hostDeviceDefaultProps[className];

    return {
      id,
      className,
      props: _defaultsDeep(
        _omit(deviceDef, 'className'),
        deviceHostDefaults,
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  /**
   * Generate definitions for all the used drivers even it doesn't have a definition.
   */
  private generateDriverDef(id: string, driverDef?: PreEntityDefinition): EntityDefinition {
    // id and className is the same for drivers
    const className = id;
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('services', className);

    return {
      id,
      className: className,
      props: _defaultsDeep(
        {},
        _omit(driverDef, 'className'),
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  private generateServiceDef(id: string, serviceDef: PreEntityDefinition): EntityDefinition {
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('services', serviceDef.className);

    return {
      id,
      className: serviceDef.className,
      props: _defaultsDeep(
        {},
        _omit(serviceDef, 'className'),
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  /**
   * Check for definitions classNames exist in manifests.
   */
  private checkDefinitions() {
    const entities: SrcEntitiesSet = this.usedEntities.getEntitiesSet();
    const check = (
      entitiesOfType: {[index: string]: SrcEntitySet},
      definitions: {[index: string]: EntityDefinition}
    ) => {
      for (let entityDef of _values(definitions)) {
        if (!entitiesOfType[entityDef.className]) {
          throw new Error(`Can't find an entity "${entityDef.className}" of definition ${JSON.stringify(entityDef)}`);
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
