import _filter = require('lodash/filter');
import _uniq = require('lodash/uniq');
import _flatten = require('lodash/flatten');

import PreHostConfig from '../interfaces/PreHostConfig';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import MasterConfig from '../MasterConfig';
import EntitiesCollection, {Dependencies, EntitiesNames} from '../entities/EntitiesCollection';


export default class HostClassNames {
  private readonly masterConfig: MasterConfig;
  private readonly entitiesCollection: EntitiesCollection;


  constructor(masterConfig: MasterConfig, entitiesCollection: EntitiesCollection) {
    this.masterConfig = masterConfig;
    this.entitiesCollection = entitiesCollection;
  }


  getEntitiesNames(hostId: string): EntitiesNames {
    const result: EntitiesNames = {
      devices: [],
      drivers: [],
      services: [],
    };

    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames(hostId);
    const allDriversClasses: string[] = this.getAllUsedDriversClassNames(hostId);
    const servicesClasses: string[] = this.getServicesClassNames(hostId);

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
  getAllUsedDriversClassNames(hostId: string): string[] {
    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames(hostId);
    const onlyDriversClasses = this.getOnlyDrivers(hostId);
    const servicesClasses: string[] = this.getServicesClassNames(hostId);

    // collect all the drivers dependencies
    return this.collectDriverNamesWithDependencies(
      devicesClasses,
      onlyDriversClasses,
      servicesClasses,
    );
  }

  getServicesClassNames(hostId: string): string[] {
    const rawHostConfig: PreHostConfig = this.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.services) return [];

    const entities: {[index: string]: any} | undefined = rawHostConfig.services;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }


  private getDevicesClassNames(hostId: string): string[] {
    const rawHostConfig: PreHostConfig = this.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.devices) return [];

    const entities: {[index: string]: any} | undefined = rawHostConfig.devices;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }

  /**
   * Get drivers and devs class names of host.
   */
  private getDriversClassNames(hostId: string): string[] {
    const rawHostConfig: PreHostConfig = this.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.drivers) return [];

    const entities: {[index: string]: any} | undefined = rawHostConfig.drivers;

    return Object.keys(entities || {})
      .map((id: string) => entities[id].className);
  }

  /**
   * Get list of used drivers of host (which has definitions) exclude devs.
   */
  private getOnlyDrivers(hostId: string): string[] {
    const driversDefinitions: string[] = this.getDriversClassNames(hostId);
    const allDevs: string[] = this.entitiesCollection.getDevs();
    // remove devs from drivers definitions list

    return _filter(
      driversDefinitions,
      (driverClassName: string) => allDevs.indexOf(driverClassName) < 0
    );
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
