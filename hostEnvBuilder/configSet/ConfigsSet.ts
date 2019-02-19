import * as path from 'path';
import _values = require('lodash/values');

import SrcEntitiesSet, {SrcEntitySet} from '../interfaces/SrcEntitiesSet';
import {sortByIncludeInList} from '../helpers';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import Definitions from './Definitions';
import ConfigManager from '../ConfigManager';
import HostConfigSet from '../interfaces/HostConfigSet';
import UsedEntities, {EntitiesNames} from '../entities/UsedEntities';


export default class ConfigsSet {
  private readonly configManager: ConfigManager;
  private readonly usedEntities: UsedEntities;
  private readonly definitions: Definitions;


  constructor(configManager: ConfigManager, usedEntities: UsedEntities, definitions: Definitions) {
    this.configManager = configManager;
    this.usedEntities = usedEntities;
    this.definitions = definitions;
  }

  getConfigSet(): HostConfigSet {
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers();
    const [
      systemServices,
      regularServices,
    ] = this.sortServices();

    return {
      config: this.configManager.hostConfig,
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.definitions.getHostDevicesDefinitions()),
      driversDefinitions: this.definitions.getHostDriversDefinitions(),
      servicesDefinitions: this.definitions.getHostServicesDefinitions(),
    };
  }

  /**
   * Get set of entities of specified host with absolute path to source files.
   */
  generateSrcEntitiesSet(): SrcEntitiesSet {
    const result: SrcEntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };
    const usedEntitiesNames: EntitiesNames = this.usedEntities.getEntitiesNames();

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        const entitySet: SrcEntitySet = this.usedEntities.getEntitySet(pluralType, className);

        result[pluralType][className] = entitySet;

        // result[pluralType][className] = {
        //   ...entitySet,
        //   files: entitySet.files.map((relativeFileName: string) => path.resolve(entitySet.srcDir, relativeFileName)),
        //   manifest: {
        //     ...entitySet.manifest,
        //     main: path.join(entitySet.srcDir, entitySet.manifest.main),
        //   },
        // };
      }
    };

    collect('devices', usedEntitiesNames.devices);
    collect('drivers', usedEntitiesNames.drivers);
    collect('services', usedEntitiesNames.services);

    return result;
  }

  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(): [string[], string[]] {
    const driversClasses: string[] = this.usedEntities.getEntitiesNames().drivers;
    const allSystemDrivers: string[] = [];

    for (let driverName of driversClasses) {
      const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('drivers', driverName);

      if (entitySet.manifest.system) allSystemDrivers.push(driverName);
    }

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(): [string[], string[]] {
    const servicesClasses: string[] = this.usedEntities.getEntitiesNames().services;
    const allSystemServices: string[] = [];

    for (let serviceName of servicesClasses) {
      const entitySet: SrcEntitySet = this.usedEntities.getEntitySet('services', serviceName);

      if (entitySet.manifest.system) allSystemServices.push(serviceName);
    }

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}
