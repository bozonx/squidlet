const _filter = require('lodash/filter');
const _uniq = require('lodash/uniq');
const _flatten = require('lodash/flatten');

import Main from './Main';
import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import {Dependencies, EntitiesNames, ManifestsTypePluralName} from './Entities';
import PreHostConfig from './interfaces/PreHostConfig';


export default class HostClassNames {
  private readonly main: Main;

  constructor(main: Main) {
    this.main = main;
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
    const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.services) return [];

    const entities: {[index: string]: any} = rawHostConfig.services;

    return Object.keys(entities)
      .map((id: string) => entities[id].service);
  }


  private getDevicesClassNames(hostId: string): string[] {
    const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.devices) return [];

    const entities: {[index: string]: any} = rawHostConfig.devices;

    return Object.keys(entities)
      .map((id: string) => entities[id].device);
  }

  /**
   * Get drivers and devs class names of host.
   */
  private getDriversClassNames(hostId: string): string[] {
    const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);

    if (!rawHostConfig.drivers) return [];

    const entities: {[index: string]: any} = rawHostConfig.drivers;

    return Object.keys(entities)
      .map((id: string) => entities[id].driver);
  }

  /**
   * Get list of used drivers of host (which has definitions) exclude devs.
   */
  private getOnlyDrivers(hostId: string): string[] {
    const driversDefinitions = this.getDriversClassNames(hostId);
    const allDevs: string[] = this.main.entities.getDevs();
    // remove devs from drivers definitions list
    const filtered = _filter(
      driversDefinitions,
      (driverClassName: string) => allDevs.indexOf(driverClassName) < 0
    );

    return filtered.map((item: EntityDefinition) => item.className);
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
    const dependencies: Dependencies = this.main.entities.getDependencies();
    let result: string[] = [];

    for (let entityClassName of names) {
      if (dependencies[pluralType][entityClassName]) {
        const resolvedDriverDeps: string[] = this.resolveDeps(dependencies[pluralType][entityClassName]);

        result = result.concat(resolvedDriverDeps);
      }
    }

    return result;
  }

  private resolveDeps(typeDependencies: string[]): string[] {
    // dependencies of all the registered entities
    const dependencies: Dependencies = this.main.entities.getDependencies();
    let result: string[] = [];

    for (let depDriverName of typeDependencies) {
      result.push(depDriverName);

      const subDeps: string[] | undefined = dependencies['drivers'][depDriverName];

      if (subDeps) {
        const resolvedDriverDeps: string[] = this.resolveDeps(subDeps);

        result = result.concat(resolvedDriverDeps);
      }
    }

    return result;
  }

}
