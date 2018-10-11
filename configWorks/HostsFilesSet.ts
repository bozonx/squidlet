const _values = require('lodash/values');
const _filter = require('lodash/filter');
const _difference = require('lodash/difference');
import * as path from 'path';

import Main from './Main';
import {EntitiesSet} from './interfaces/EntitySet';
import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import {Dependencies, EntitiesNames, ManifestsTypePluralName} from './Entities';
import DefinitionsSet from './interfaces/DefinitionsSet';
import {sortByIncludeInList} from './helpers';


export default class HostsFilesSet {
  private readonly main: Main;

  constructor(main: Main) {
    this.main = main;
  }

  getDefinitionsSet(hostId: string): DefinitionsSet {
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers(hostId);
    const [
      systemServices,
      regularServices,
    ] = this.sortServices(hostId);

    return {
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.main.definitions.getHostDevicesDefinitions(hostId)),
      driversDefinitions: this.main.definitions.getHostDriversDefinitions(hostId),
      servicesDefinitions: this.main.definitions.getHostServicesDefinitions(hostId),
    };
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
   * Get set of entities of specified host with absolute path to source files.
   */
  generateSrcEntitiesSet(hostId: string): EntitiesSet {
    const result: EntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };

    const usedEntitiesNames: EntitiesNames = this.getEntitiesNames(hostId);

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        const srcDir = this.main.entities.getSrcDir(pluralType, className);
        const relativeMain: string | undefined = this.main.entities.getMainFilePath(pluralType, className);
        const relativeFiles: string[] = this.main.entities.getFiles(pluralType, className);

        result[pluralType][className] = {
          manifest: this.main.entities.getManifest(pluralType, className),
          main: relativeMain && path.resolve(srcDir, relativeMain),
          files: relativeFiles.map((relativeFileName: string) => path.resolve(srcDir, relativeFileName)),
        };
      }
    };

    collect('devices', usedEntitiesNames.devices);
    collect('drivers', usedEntitiesNames.drivers);
    collect('services', usedEntitiesNames.services);

    return result;
  }

  generateDstEntitiesSet(main: Main, hostId: string): EntitiesSet {
    const result: EntitiesSet = {
      devices: {},
      drivers: {},
      services: {},
    };

    // TODO: move to HostsFilesSet
    // TODO: make requireJs paths
    // TODO: test it

    return result;
  }

  /**
   * Check than all the host's dev dependencies exist in platform deps list.
   */
  checkPlatformDevDeps() {
    for (let hostId of this.main.masterConfig.getHostsIds()) {
      const hostEntitiesNames: EntitiesNames = this.getEntitiesNames(hostId);
      const hostDevs: string[] = this.getHostDevs(hostEntitiesNames);
      const platformDevs: string[] = this.main.masterConfig.getHostPlatformDevs(hostId);

      const notRegisteredHostDevs: string[] = _difference(hostDevs, platformDevs);

      if (notRegisteredHostDevs.length) {
        throw new Error(`Not registered dev dependencies "${JSON.stringify(notRegisteredHostDevs)}"
         of host "${hostId}" have been found.`);
      }
    }
  }


  /**
   * Get list of devs used on host
   */
  private getHostDevs(hostEntitiesNames: EntitiesNames): string[] {
    const devDeps: Dependencies = this.main.entities.getDevDependencies();
    const result: {[index: string]: true} = {};

    for (let pluralName of Object.keys(hostEntitiesNames)) {
      for (let entityName of hostEntitiesNames[pluralName as ManifestsTypePluralName]) {
        const deps: string[] | undefined = devDeps[pluralName as ManifestsTypePluralName][entityName];

        if (deps) {
          for (let dep of deps) {
            result[dep] = true;
          }
        }
      }
    }

    return Object.keys(result);
  }

  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(hostId: string): [string[], string[]] {
    const driversClasses: string[] = this.getAllUsedDriversClassNames(hostId);
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

  private getDevicesClassNames(hostId: string): string[] {
    const devicesDefinitions = this.main.definitions.getHostDevicesDefinitions(hostId);

    return Object.keys(devicesDefinitions)
      .map((id: string) => devicesDefinitions[id].className);
  }

  /**
   * All the used drivers include which are dependencies of other entities bu without devs.
   */
  private getAllUsedDriversClassNames(
    hostId: string
  ): string[] {
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

  /**
   * Get list of used drivers on host exclude devs.
   */
  private getOnlyDrivers(hostId: string): string[] {
    const driversDefinitions = this.main.definitions.getHostDriversDefinitions(hostId);
    const devs: string[] = this.main.entities.getDevs();
    // remove devs from drivers definitions list
    const filtered = _filter(
      driversDefinitions,
      (item: EntityDefinition) => devs.indexOf(item.className) < 0
    );

    return filtered.map((item: EntityDefinition) => item.className);
  }

  private getServicesClassNames(hostId: string): string[] {
    const servicesDefinitions = this.main.definitions.getHostServicesDefinitions(hostId);

    if (!servicesDefinitions) return [];

    return Object.keys(servicesDefinitions)
      .map((id: string) => servicesDefinitions[id].className);
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

}
