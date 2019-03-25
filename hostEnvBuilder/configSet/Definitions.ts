import _defaultsDeep = require('lodash/defaultsDeep');
import _omit = require('lodash/omit');

import EntityDefinition from '../../host/interfaces/EntityDefinition';
import PreEntityDefinition from '../interfaces/PreEntityDefinition';
import SrcEntitySet from '../interfaces/HostEntitiesSet';
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


  getDevicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.devicesDefinitions;
  }

  getDriversDefinitions(): {[index: string]: EntityDefinition} {
    return this.driversDefinitions;
  }

  getServicesDefinitions(): {[index: string]: EntityDefinition} {
    return this.servicesDefinitions;
  }

  /**
   * Make definitions of all the used entities of host
   */
  generate() {
    const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();

    // make devices
    for (let id of Object.keys(this.configManager.preEntities.devices)) {
      this.devicesDefinitions[id] = this.generateDeviceDef(id);
    }

    // make each all drivers of host include dependencies but exclude devs
    for (let entityName of usedEntitiesNames.drivers) {
      this.driversDefinitions[entityName] = this.generateDriverDef(entityName);
    }

    // make services
    for (let entityName of Object.keys(this.configManager.preEntities.services)) {
      this.servicesDefinitions[entityName] = this.generateServiceDef(entityName);
    }
  }


  private generateDeviceDef(id: string): EntityDefinition {
    const deviceDef: {[index: string]: any} = this.configManager.preEntities.devices[id];
    const hostDeviceDefaultProps = this.configManager.devicesDefaults;
    const className: string = deviceDef.className;
    const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('devices', className);

    return {
      id,
      className,
      props: _defaultsDeep(
        // definition
        _omit(deviceDef, 'className'),

        // host's defaults
        hostDeviceDefaultProps && hostDeviceDefaultProps[className],

        // manifest's defaults
        this.collectManifestPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  /**
   * Generate definitions for all the used drivers even it doesn't have a definition.
   */
  private generateDriverDef(className: string): EntityDefinition {
    const driverDef: PreEntityDefinition = this.configManager.preEntities.drivers[className];
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
    const serviceDef: PreEntityDefinition = this.configManager.preEntities.services[id];
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
