import _defaultsDeep = require('lodash/defaultsDeep');

import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import PreEntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreEntityDefinition.js';
import HostEntitySet from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostEntitySet.js';
import ConfigManager from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/ConfigManager.js';
import UsedEntities, {EntitiesNames} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/UsedEntities.js';
import {validateProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/validate.js';
import {IoDefinitions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';
import {collectPropsDefaults} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import {omitObj} from '../../../../squidlet-lib/src/objects';


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

  getIosDefinitions(): IoDefinitions {
    return this.configManager.iosDefinitions;
  }

  /**
   * Make definitions of all the used entities of host
   */
  generate() {
    const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();

    this.validateDevicesDefault();

    // make devices
    for (let id of Object.keys(this.configManager.preEntities.devices)) {
      this.devicesDefinitions[id] = this.generateDeviceDef(id);
    }

    // make each all drivers of host include dependencies but exclude ios
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
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet('device', className);
    const definitionProps: {[index: string]: any} = omitObj(deviceDef, 'className');
    const validationError: string | undefined = validateProps(definitionProps, entitySet.manifest.props);

    if (validationError) {
      throw new Error(`Definition of device "${id}" is incorrect: ${validationError}`);
    }

    return {
      id,
      className,
      props: _defaultsDeep(
        // definition
        definitionProps,

        // host's defaults
        hostDeviceDefaultProps && hostDeviceDefaultProps[className],

        // manifest's defaults
        collectPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  /**
   * Generate definitions for all the used drivers even it doesn't have a definition.
   */
  private generateDriverDef(className: string): EntityDefinition {
    const driverDef: PreEntityDefinition = this.configManager.preEntities.drivers[className];
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet('driver', className);
    const definitionProps: {[index: string]: any} = omitObj(driverDef, 'className');
    const validationError: string | undefined = validateProps(definitionProps, entitySet.manifest.props);

    if (validationError) {
      throw new Error(`Definition of driver "${className}" is incorrect: ${validationError}`);
    }

    return {
      // id and className is the same for drivers
      id: className,
      className: className,
      props: _defaultsDeep(
        definitionProps,
        collectPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  private generateServiceDef(id: string): EntityDefinition {
    const serviceDef: PreEntityDefinition = this.configManager.preEntities.services[id];
    const entitySet: HostEntitySet = this.usedEntities.getEntitySet('service', serviceDef.className);
    const definitionProps: {[index: string]: any} = omitObj(serviceDef, 'className');
    const validationError: string | undefined = validateProps(definitionProps, entitySet.manifest.props);

    if (validationError) {
      throw new Error(`Definition of driver "${id}" is incorrect: ${validationError}`);
    }

    return {
      id,
      className: serviceDef.className,
      props: _defaultsDeep(
        definitionProps,
        collectPropsDefaults(entitySet.manifest.props),
      ),
    };
  }

  private validateDevicesDefault() {
    const defaults: {[index: string]: {[index: string]: any}} | undefined = this.configManager.devicesDefaults;

    if (!defaults) return;

    for (let deviceClassName of Object.keys(defaults)) {
      const entitySet: HostEntitySet = this.usedEntities.getEntitySet('device', deviceClassName);
      const validationError: string | undefined = validateProps(defaults[deviceClassName], entitySet.manifest.props);

      if (validationError) {
        throw new Error(`Invalid device prop of "${deviceClassName}" of devicesDefaults of host config: ${validationError}`);
      }
    }
  }

}
