import HostConfig from '../host/src/app/interfaces/HostConfig';

const _values = require('lodash/values');
const _filter = require('lodash/filter');

import Main from './Main';
import EntityDefinition from '../host/src/app/interfaces/EntityDefinition';
import {AllManifests, Dependencies, FilesPaths, ManifestsTypePluralName} from './Entities';
import HostFilesSet, {DefinitionsSet, EntitiesSet} from './interfaces/HostFilesSet';
import {sortByIncludeInList} from './helpers';


export default class HostsFilesSet {
  private readonly main: Main;
  // file sets by hostId
  private files: {[index: string]: HostFilesSet} = {};

  constructor(main: Main) {
    this.main = main;
  }

  getCollection(): {[index: string]: HostFilesSet} {
    // TODO: наверное генерировать на месте - метод collect()
    return this.files;
  }

  /**
   * Generate master config with integrated files set which points to original (ts or js) files
   */
  async generateMasterSet(): Promise<HostConfig> {
    const hostId = 'master';
    const masterHostConfig = this.main.hostsConfigSet.getHostConfig(hostId);

    return {
      ...masterHostConfig,
      config: {
        ...masterHostConfig.config,
        params: {
          ...masterHostConfig.config.params,
          configSet: {
            ...this.getDefinitionsSet(hostId),
            ...this.getOriginalEntitiesSet(hostId),
          }
        }
      }
    };
  }

  async generateHostSet(hostId: string): {[index: string]: any} {
    // TODO: задать тип
    // TODO: возвращает только пути файлов относительно хранилища
    // TODO: !!!!
    // TODO: конфиг должен валидироваться в том числе и имя платформы
    // TODO: сгенерировать js объект с конфигами хоста и entitites
  }


  private getDefinitionsSet(hostId: string): DefinitionsSet {
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
      systemDrivers,
      regularDrivers,
      systemServices,
      regularServices,
      devicesDefinitions: _values(this.main.definitions.getHostDevicesDefinitions(hostId)),
      driversDefinitions: this.main.definitions.getHostDriversDefinitions(hostId),
      servicesDefinitions: this.main.definitions.getHostServicesDefinitions(hostId),
    };
  }

  private getOriginalEntitiesSet(hostId: string): EntitiesSet {
    const result: EntitiesSet = {
      // parsed manifests
      entitiesManifests: { devices: {}, drivers: {}, services: {} },
      // paths to original main files
      entitiesMains: { devices: {}, drivers: {}, services: {} },
      // paths to original files
      entitiesFiles: { devices: {}, drivers: {}, services: {} },
    };

    // TODO: use only original
    const allManifests: AllManifests = this.main.entities.getManifests();
    const allMains: FilesPaths = this.main.entities.getMainFiles();
    const allEntitiesFiles: FilesPaths = this.main.entities.getEntitiesFiles();

    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames(hostId);
    const allDriversClasses: string[] = this.getAllUsedDriversClassNames(hostId);
    const servicesClasses: string[] = this.getServicesClassNames(hostId);

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        result.entitiesManifests[pluralType][className] = allManifests[pluralType][className];
        result.entitiesMains[pluralType][className] = allMains[pluralType][className];
        result.entitiesFiles[pluralType][className] = allEntitiesFiles[pluralType][className];
      }
    };

    collect('devices', devicesClasses);
    collect('drivers', allDriversClasses);
    collect('services', servicesClasses);

    return result;
  }

  /**
   * Generate file set for each host
   */
  collect() {
    const hostIds: string[] = this.main.hostsConfigSet.getHostsIds();

    for (let hostId of hostIds) {

      // TODO: проверить что getDevDependencies есть среди devs платформы

      this.files[hostId] = {
        config: this.main.hostsConfigSet.getHostConfig(hostId),
        entitiesFiles: this.collectEntitiesFiles(hostId),
        entitiesManifests: this.collectEntitiesManifests(),
        ...this.getDefinitionsSet(hostId),
      };
    }
  }


  private collectEntitiesManifests() {

  }

  private collectEntitiesOriginalFiles() {

  }

  // TODO: зачем это нужно????
  private collectEntitiesFiles(hostId: string): FilesPaths {

    // TODO: remake - только файлы - ссылка на оргинальный файл и куда запиывать

    const result: FilesPaths = {
      devices: {},
      drivers: {},
      services: {},
    };
    const allEntitiesFiles: FilesPaths = this.main.entities.getFiles();
    // collect manifest names of used entities
    const devicesClasses = this.getDevicesClassNames(hostId);
    const allDriversClasses: string[] = this.getAllUsedDriversClassNames(hostId);
    const servicesClasses: string[] = this.getServicesClassNames(hostId);

    const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
      for (let className of classes) {
        result[pluralType][className] = allEntitiesFiles[pluralType][className];
      }
    };

    collect('devices', devicesClasses);
    collect('drivers', allDriversClasses);
    collect('services', servicesClasses);

    return result;
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

  getDevicesClassNames(hostId: string): string[] {
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

  getServicesClassNames(hostId: string): string[] {
    const servicesDefinitions = this.main.definitions.getHostServicesDefinitions(hostId);

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
