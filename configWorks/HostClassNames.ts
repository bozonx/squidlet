const _filter = require('lodash/filter');
const _uniq = require('lodash/uniq');
const _flatten = require('lodash/flatten');

import Main from './Main';
import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import {Dependencies, EntitiesNames, ManifestsTypePluralName} from './Entities';


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
    // const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);
    //
    // if (!rawHostConfig.services) return [];
    //
    // // TODO: проверить что на данный момент уже сервисы переложенны из shortcut
    //
    // console.log(111111111, rawHostConfig)
    //
    // return Object.keys(rawHostConfig.services)
    //   .map((id: string) => (rawHostConfig.services as any)[id].service);

    const servicesDefinitions = this.main.definitions.getHostServicesDefinitions(hostId);

    if (!servicesDefinitions) return [];

    return Object.keys(servicesDefinitions)
      .map((id: string) => servicesDefinitions[id].className);
  }


  private getDevicesClassNames(hostId: string): string[] {
    // const rawHostConfig: PreHostConfig = this.main.masterConfig.getPreHostConfig(hostId);
    //
    // if (!rawHostConfig.devices) return [];
    //
    // return Object.keys(rawHostConfig.devices);

    const devicesDefinitions = this.main.definitions.getHostDevicesDefinitions(hostId);

    return Object.keys(devicesDefinitions)
      .map((id: string) => devicesDefinitions[id].className);
  }

  /**
   * Get list of used drivers of host (which has definitions) exclude devs.
   */
  private getOnlyDrivers(hostId: string): string[] {
    const driversDefinitions = this.main.definitions.getHostDriversDefinitions(hostId);
    const allDevs: string[] = this.main.entities.getDevs();
    // remove devs from drivers definitions list
    const filtered = _filter(
      driversDefinitions,
      (item: EntityDefinition) => allDevs.indexOf(item.className) < 0
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
