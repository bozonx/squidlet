const _map = require('lodash/map');

import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import Manifests, {Dependencies, ManifestsTypePluralName} from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';
import HostFilesSet from './interfaces/HostFilesSet';
import {sortByIncludeInList} from './helpers';


export default class HostsFilesSet {
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  // file sets by hostId
  private files: {[index: string]: HostFilesSet} = {};

  constructor(manifests: Manifests, hostsConfigGenerator: HostsConfigGenerator) {
    this.manifests = manifests;
    this.hostsConfigGenerator = hostsConfigGenerator;
  }

  getCollection(): {[index: string]: HostFilesSet} {
    return this.files;
  }

  /**
   * Generate file set for each host
   */
  collect() {
    const hostIds: string[] = this.hostsConfigGenerator.getHostsIds();

    for (let hostId of hostIds) {
      this.files[hostId] = this.combineHostFileSet(hostId);
    }
  }

  private combineHostFileSet(hostId: string): HostFilesSet {
    const {
      devicesClasses,
      driversClasses,
      servicesClasses,
    } = this.generateEntityNames(hostId);
    const [
      systemDrivers,
      regularDrivers,
    ] = this.sortDrivers(driversClasses);
    const [
      systemServices,
      regularServices,
    ] = this.sortServices(servicesClasses);

    // TODO: проверить что запрашиваемые имена есть среди манифестов
    // TODO: проверить что getDevDependencies есть среди devs платформы

    return {
      config: this.hostsConfigGenerator.getHostConfig(hostId),

      devicesManifests: this.collectManifests<DeviceManifest>('devices', devicesClasses),
      driversManifests: this.collectManifests<DriverManifest>('drivers', driversClasses),
      servicesManifests: this.collectManifests<ServiceManifest>('services', servicesClasses),

      driversFiles: this.collectFiles('devices', devicesClasses),
      devicesFiles: this.collectFiles('drivers', driversClasses),
      servicesFiles: this.collectFiles('services', servicesClasses),

      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,

      devicesDefinitions: _map(this.hostsConfigGenerator.getDevicesDefinitions(hostId)),
      driversDefinitions: this.hostsConfigGenerator.getDriversDefinitions(hostId),
      servicesDefinitions: this.hostsConfigGenerator.getServicesDefinitions(hostId),
    };
  }

  /**
   * Generaеe entities manifest names which are used on host
   */
  private generateEntityNames(
    hostId: string
  ): {devicesClasses: string[], driversClasses: string[], servicesClasses: string[]} {
    const devicesDefinitions = this.hostsConfigGenerator.getDevicesDefinitions(hostId);
    const driversDefinitions = this.hostsConfigGenerator.getDriversDefinitions(hostId);
    const servicesDefinitions = this.hostsConfigGenerator.getServicesDefinitions(hostId);

    // collect manifest names of used entities
    const devicesClasses = Object.keys(devicesDefinitions)
      .map((id: string) => devicesDefinitions[id].className);
    // TODO: могут быть указанны dev в definitions - их не нужно подключать
    const onlyDriversClasses = Object.keys(driversDefinitions)
      .map((id: string) => driversDefinitions[id].className);
    const servicesClasses = Object.keys(servicesDefinitions)
      .map((id: string) => servicesDefinitions[id].className);

    // collect all the drivers dependencies
    const driversClasses = this.collectDriverNamesWithDependencies(
      devicesClasses,
      onlyDriversClasses,
      servicesClasses,
    );

    return {
      devicesClasses,
      driversClasses,
      servicesClasses,
    };
  }

  /**
   * Collect of the drivers which are dependencies of devices, drivers or services
   */
  private collectDriverNamesWithDependencies(
    devicesClasses: string[],
    driversClasses: string[],
    servicesClasses: string[]
  ): string[] {
    const dependencies: Dependencies = this.manifests.getDependencies();
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

  /**
   * Collect all the used host manifest of devices, drivers or services
   */
  private collectManifests<T>(manifestPluralType: ManifestsTypePluralName, usedEntityNames: string[]): T[] {
    const allManifests = this.manifests.getManifests() as any;
    const allManifestsOfType: {[index: string]: T} = allManifests[manifestPluralType];

    return usedEntityNames.map((usedEntityName: string) => allManifestsOfType[usedEntityName]);
  }

  /**
   * Collect all the used host files of devices, drivers or services
   */
  private collectFiles(
    manifestPluralType: ManifestsTypePluralName,
    entityNames: string[]
  ): {[index: string]: string[]} {
    const files = this.manifests.getFiles()[manifestPluralType];
    // files paths by entity name
    const result: {[index: string]: string[]} = {};

    for (let usedEntityName of entityNames) {
      result[usedEntityName] = files[usedEntityName];
    }

    return result;
  }

  /**
   * sort drivers to system and regular
   * @returns [systemDrivers, regularDrivers]
   */
  private sortDrivers(driversClasses: string[]): [string[], string[]] {
    const allSystemDrivers: string[] = this.manifests.getSystemDrivers();

    return sortByIncludeInList(driversClasses, allSystemDrivers);
  }

  /**
   * sort services to system and regular
   * @returns [systemServices, regularServices]
   */
  private sortServices(servicesClasses: string[]) {
    const allSystemServices: string[] = this.manifests.getSystemServices();

    return sortByIncludeInList(servicesClasses, allSystemServices);
  }

}
