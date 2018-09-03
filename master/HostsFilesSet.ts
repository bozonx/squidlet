const _values = require('lodash/values');

import Main from './Main';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import {Dependencies, ManifestsTypePluralName} from './Entities';
import HostFilesSet from './interfaces/HostFilesSet';
import {sortByIncludeInList} from './helpers';


export default class HostsFilesSet {
  private readonly main: Main;
  // file sets by hostId
  private files: {[index: string]: HostFilesSet} = {};

  constructor(main: Main) {
    this.main = main;
  }

  getCollection(): {[index: string]: HostFilesSet} {
    return this.files;
  }

  /**
   * Generate file set for each host
   */
  collect() {
    const hostIds: string[] = this.main.hostsConfigSet.getHostsIds();

    for (let hostId of hostIds) {
      this.files[hostId] = this.combineHostFileSet(hostId);
    }
  }

  private combineHostFileSet(hostId: string): HostFilesSet {
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers(hostId);
    const [
      systemServices,
      regularServices,
    ] = this.sortServices(hostId);

    // TODO: проверить что getDevDependencies есть среди devs платформы

    return {
      config: this.main.hostsConfigSet.getHostConfig(hostId),
      entitiesFiles: this.main.entities.getFiles(),
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.main.definitions.getHostDevicesDefinitions(hostId)),
      driversDefinitions: this.main.definitions.getHostDriversDefinitions(hostId),
      servicesDefinitions: this.main.definitions.getHostServicesDefinitions(hostId),
    };
  }

  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(hostId: string): [string[], string[]] {
    const driversClasses: string[] = this.collectUsedDriversClasses(hostId);

    const allSystemDrivers: string[] = this.main.entities.getSystemDrivers();

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(hostId: string): [string[], string[]] {
    const servicesClasses: string[] = this.getServicesClassNames(hostId);
    const allSystemServices: string[] = this.main.entities.getSystemServices();

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

  getDevicesClassNames(hostId: string): string[] {
    const devicesDefinitions = this.main.definitions.getHostDevicesDefinitions(hostId);

    return Object.keys(devicesDefinitions)
      .map((id: string) => devicesDefinitions[id].className);
  }

  getServicesClassNames(hostId: string): string[] {
    const servicesDefinitions = this.main.definitions.getHostServicesDefinitions(hostId);

    return Object.keys(servicesDefinitions)
      .map((id: string) => servicesDefinitions[id].className);
  }

  /**
   * Generate entities manifest names which are used on host
   */
  private collectUsedDriversClasses(
    hostId: string
  ): string[] {
    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames(hostId);
    const onlyDriversClasses = this.collectOnlyDrivers(hostId);
    const servicesClasses: string[] = this.getServicesClassNames(hostId);

    // collect all the drivers dependencies
    return this.collectDriverNamesWithDependencies(
      devicesClasses,
      onlyDriversClasses,
      servicesClasses,
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
    const dependencies: Dependencies = this.main.entities.getDependencies();
    // there is an object for deduplicate purpose
    const depsDriversNames: {[index: string]: true} = {};

    function addDeps(pluralType: ManifestsTypePluralName, names: string[]) {
      for (let entityName of names) {
        // do nothing id entity doesn't have a dependencies
        if (!dependencies[pluralType][entityName]) return;

        dependencies[pluralType][entityName]
          .forEach((depDriverName: string) => depsDriversNames[depDriverName] = true);
      }
    }

    // first add all the driver names
    for (let className of driversClasses) {
      depsDriversNames[className] = true;
    }
    // add deps of devices
    addDeps('devices', devicesClasses);
    // add deps of drivers
    addDeps('drivers', driversClasses);
    // add deps of services
    addDeps('services', servicesClasses);

    // get only driver class names
    return Object.keys(depsDriversNames);
  }

  // TODO: почему удаляем ?????

  private collectOnlyDrivers(hostId: string): string[] {
    const driversDefinitions = this.main.definitions.getHostDriversDefinitions(hostId);
    const devs: string[] = this.main.entities.getDevs();
    // remove devs from drivers definitions list
    const filtered = (driversDefinitions as {[index: string]: any})
      .filter((item: DriverDefinition) => {
        return devs.indexOf(item.className) >= 0;
      });

    return filtered.map((id: string) => driversDefinitions[id].className);
  }

}
