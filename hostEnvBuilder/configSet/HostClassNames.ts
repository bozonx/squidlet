import _filter = require('lodash/filter');
import _uniq = require('lodash/uniq');
import _flatten = require('lodash/flatten');

import PreHostConfig from '../interfaces/PreHostConfig';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import ConfigManager from '../ConfigManager';
import EntitiesCollection, {Dependencies, EntitiesNames} from '../entities/EntitiesCollection';
import {SrcEntitySet} from '../interfaces/SrcEntitiesSet';


export default class HostClassNames {
  private readonly configManager: ConfigManager;
  private readonly entitiesCollection: EntitiesCollection;


  constructor(configManager: ConfigManager, entitiesCollection: EntitiesCollection) {
    this.configManager = configManager;
    this.entitiesCollection = entitiesCollection;
  }


  /**
   * Generate class names of all the used entities
   */
  getEntitiesNames(): EntitiesNames {
    const result: EntitiesNames = {
      devices: [],
      drivers: [],
      services: [],
    };

    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames();
    const allDriversClasses: string[] = this.getAllUsedDriversClassNames();
    const servicesClasses: string[] = this.getServicesClassNames();

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        result[pluralType].push(className);
      }
    };

    collect('devices', devicesClasses);
    collect('drivers', allDriversClasses);
    collect('services', servicesClasses);

    return result;
  }

  /**
   * All the used drivers include which are dependencies of other entities but without devs.
   */
  getAllUsedDriversClassNames(): string[] {
    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames();
    const onlyDriversClasses = this.getOnlyDrivers();
    const servicesClasses: string[] = this.getServicesClassNames();

    // collect all the drivers dependencies
    return this.collectDriverNamesWithDependencies(
      devicesClasses,
      onlyDriversClasses,
      servicesClasses,
    );
  }

  getServicesClassNames(): string[] {
    if (!this.configManager.preHostConfig.services) return [];

    const entities: {[index: string]: any} | undefined = this.configManager.preHostConfig.services;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }


  private getDevicesClassNames(): string[] {
    if (!this.configManager.preHostConfig.devices) return [];

    const entities: {[index: string]: any} | undefined = this.configManager.preHostConfig.devices;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }

  /**
   * Get drivers and devs class names of host.
   */
  private getDriversClassNames(): string[] {
    if (!this.configManager.preHostConfig.drivers) return [];

    const entities: {[index: string]: any} | undefined = this.configManager.preHostConfig.drivers;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }

  /**
   * Get list of used drivers of host (which has definitions) exclude devs.
   */
  private getOnlyDrivers(): string[] {
    const driversDefinitions: string[] = this.getDriversClassNames();
    const allDevs: string[] = this.getDevs();
    // remove devs from drivers definitions list

    return _filter(
      driversDefinitions,
      (driverClassName: string) => allDevs.indexOf(driverClassName) < 0
    );
  }

  /**
   * Get all the devs class names.
   * Collect they from drivers and all the dependencies
   */
  getDevs(): string[] {
    const result: {[index: string]: true} = {};
    const drivers: {[index: string]: SrcEntitySet} = this.entitiesCollection.getEntitiesSet().drivers;
    const devDependencies = this.entitiesCollection.getDependencies();

    // TODO: review
    const collect = (depsOfType: {[index: string]: string[]}) => {
      for (let entityName of Object.keys(depsOfType)) {
        for (let itemName of depsOfType[entityName]) {
          result[itemName] = true;
        }
      }
    };

    // TODO: у dev нет манифеста
    // get devs from drivers
    for (let itemName of Object.keys(drivers)) {
      if (drivers[itemName].manifest.dev) result[itemName] = true;
    }

    // dev dependencies of entities
    collect(devDependencies.devices);
    collect(devDependencies.drivers);
    collect(devDependencies.services);

    return Object.keys(result);
  }

  /**
   * Collect of the drivers which are dependencies of devices, drivers or services
   */
  private collectDriverNamesWithDependencies(
    devicesClasses: string[],
    driversClasses: string[],
    servicesClasses: string[]
  ): string[] {
    let result: string[][] = [
      driversClasses,
      // add deps of devices
      this.addDeps('devices', devicesClasses),
      // add deps of drivers
      this.addDeps('drivers', driversClasses),
      // add deps of services
      this.addDeps('services', servicesClasses),
    ];

    return _uniq(_flatten(result));
  }

  private addDeps(pluralType: ManifestsTypePluralName, names: string[]): string[] {
    // dependencies of all the registered entities
    const dependencies: Dependencies = this.entitiesCollection.getDependencies();
    let result: string[] = [];

    for (let entityClassName of names) {
      if (dependencies[pluralType][entityClassName]) {
        const resolvedDriverDeps: string[] = this.resolveDeps(pluralType, entityClassName);

        result = result.concat(resolvedDriverDeps);
      }
    }

    return _uniq(result);
  }

  private resolveDeps(pluralType: ManifestsTypePluralName, name: string): string[] {
    const dependencies: Dependencies = this.entitiesCollection.getDependencies();
    let result: string[] = [];
    // items which were processed to avoid infinity recursion
    const processedItems: string[] = [];

    const recursively = (processingPluralType: ManifestsTypePluralName, processingName: string) => {
      processedItems.push(`${processingPluralType}-${processingName}`);

      const typeDependencies: string[] = dependencies[processingPluralType][processingName];

      for (let depDriverName of typeDependencies) {
        result.push(depDriverName);

        const subDeps: string[] | undefined = dependencies['drivers'][depDriverName];

        if (subDeps && !processedItems.includes(`drivers-${depDriverName}`)) {
          recursively('drivers', depDriverName);
        }
      }
    };

    recursively(pluralType, name);

    return result;
  }

}
