const _omit = require('lodash/omit');
import * as path from 'path';

import Main from './Main';
import {SrcEntitiesSet, SrcEntitySet} from './interfaces/EntitySet';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import PreManifestBase from './interfaces/PreManifestBase';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import systemConfig from './configs/systemConfig';


export type ManifestsTypeName = 'device' | 'driver' | 'service';
export type ManifestsTypePluralName = 'devices' | 'drivers' | 'services';


// dependencies of item
export interface Dependencies {
  // list of dependencies of devices by device name
  devices: {[index: string]: string[]};
  // list of dependencies of drivers by driver name
  drivers: {[index: string]: string[]};
  // list of dependencies of services by service name
  services: {[index: string]: string[]};
}

// lists of names of all the entities
export interface EntitiesNames {
  devices: string[];
  drivers: string[];
  services: string[];
}

export default class Entities {
  private readonly main: Main;
  private readonly entitiesDir: string;
  // entities set which contains a srcDir which point to dir where original manifest places
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };
  // temporary driver and devs deps list like {EntityType: {EntityId: [...DriverName]}}. Exclude devs
  private unsortedDependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  // driver deps like {EntityType: {EntityId: [...DriverName]}}. Exclude devs
  private dependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  // list of devs like {EntityType: {EntityId: [...DriverName]}}
  // they have param "dev" in manifest or if it doesn't have a manifest its name ends with ".dev".
  private devDependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  private systemDrivers: string[] = [];
  private systemServices: string[] = [];


  constructor(main: Main) {
    this.main = main;
    this.entitiesDir = path.join(this.main.masterConfig.buildDir, systemConfig.entityBuildDir);
  }

  getEntitiesSet(): SrcEntitiesSet {
    return this.entitiesSet;
  }

  getAllEntitiesNames(): EntitiesNames {
    const allEntities: SrcEntitiesSet = this.getEntitiesSet();

    return {
      devices: Object.keys(allEntities.devices),
      drivers: Object.keys(allEntities.drivers),
      services: Object.keys(allEntities.services),
    };
  }

  getSrcDir(pluralType: ManifestsTypePluralName, name: string): string {
    return this.entitiesSet[pluralType][name].srcDir;
  }

  getManifest(pluralType: ManifestsTypePluralName, name: string): ManifestBase {
    return this.entitiesSet[pluralType][name].manifest;
  }

  getMainFilePath(pluralType: ManifestsTypePluralName, name: string): string | undefined {
    return this.entitiesSet[pluralType][name].main;
  }

  getFiles(pluralType: ManifestsTypePluralName, name: string): string[] {
    return this.entitiesSet[pluralType][name].files;
  }

  getDependencies(): Dependencies {
    return this.dependencies;
  }

  getDevDependencies(): Dependencies {
    return this.devDependencies;
  }

  getSystemDrivers(): string[] {
    return this.systemDrivers;
  }

  getSystemServices(): string[] {
    return this.systemServices;
  }

  /**
   * Get all the devs.
   * Collect they from drivers and all the dependencies
   */
  getDevs(): string[] {
    const result: {[index: string]: true} = {};
    const drivers: {[index: string]: SrcEntitySet} = this.getEntitiesSet().drivers;

    const collect = (depdOfType: {[index: string]: string[]}) => {
      for (let entityName of Object.keys(depdOfType)) {
        for (let itemName of depdOfType[entityName]) {
          result[itemName] = true;
        }
      }
    };

    // get devs from drivers
    for (let itemName of Object.keys(drivers)) {
      if (drivers[itemName].manifest.dev) result[itemName] = true;
    }

    // dev dependencies of entities
    collect(this.devDependencies.devices);
    collect(this.devDependencies.drivers);
    collect(this.devDependencies.services);

    return Object.keys(result);
  }

  async generate() {
    const preDevicesManifests = this.main.register.getDevicesPreManifests();
    const prePreDriverManifest = this.main.register.getDriversPreManifests();
    const prePreServiceManifest = this.main.register.getServicesPreManifests();

    for (let item of preDevicesManifests) {
      await this.proceed<DeviceManifest>('device', item);
    }

    for (let item of prePreDriverManifest) {
      await this.proceed<DriverManifest>('driver', item);
    }

    for (let item of prePreServiceManifest) {
      await this.proceed<ServiceManifest>('service', item);
    }

    //this.resolveDriversDeps();
    // sort deps drivers and devs and save they to separate list
    this.sortDependencies();
    this.generateSystemDriversList();
    this.generateSystemServicesList();
  }


  private async proceed<FinalManifest extends ManifestBase>(
    manifestType: ManifestsTypeName,
    preManifest: PreManifestBase,
  ) {
    const pluralType = `${manifestType}s` as ManifestsTypePluralName;
    const finalManifest: FinalManifest = await this.prepareManifest<FinalManifest>(preManifest);

    this.entitiesSet[pluralType][preManifest.name] = {
      srcDir: preManifest.baseDir,
      manifest: finalManifest,
      main: preManifest.main,
      files: preManifest.files || [],
    };

    // just save unsorted deps
    if (preManifest.drivers) {
      this.unsortedDependencies[pluralType][preManifest.name] = preManifest.drivers;
    }
  }

  private async prepareManifest<FinalManifest extends ManifestBase>(
    preManifest: PreManifestBase
  ): Promise<FinalManifest> {
    const finalManifest: FinalManifest = _omit(
      preManifest,
      'files',
      'main',
      'baseDir'
    );

    // load props file
    if (typeof preManifest.props === 'string') {
      finalManifest.props = this.main.io.loadYamlFile(preManifest.props);
    }

    return finalManifest;
  }

  private resolveDriversDeps() {
    // TODO: наверное лучше сначала подготовить список???

    const recursively = (deps: {[index: string]: string[] }) => {
      for (let driverClassName of Object.keys(deps)) {
        //const driverDeps: string[] = deps[driverClassName];

        for (let subDependency of deps[driverClassName]) {
          // TODO: загрузить preManifest
        }
      }
      // загружаем манифест каждой зависимости
      // если там тоже есть зависимость - то добавляем ее в this.unsortedDependencies
      // далее рекурсивно
    };

    recursively(this.unsortedDependencies['drivers']);
  }

  /**
   * Sort dependencies to drivers and devs
   */
  private sortDependencies() {
    const sortType = (pluralType: ManifestsTypePluralName) => {
      const dictByName: {[index: string]: string[]} = this.unsortedDependencies[pluralType];

      for (let entityName of Object.keys(dictByName)) {
        for (let driverName of dictByName[entityName]) {
          this.sortDriver(pluralType, entityName, driverName);
        }
      }
    };

    sortType('devices');
    sortType('drivers');
    sortType('services');
  }

  private sortDriver(pluralType: ManifestsTypePluralName, entityName: string, driverName: string) {
    const drivers: {[index: string]: SrcEntitySet} = this.getEntitiesSet().drivers;

    if (!drivers[driverName]) {
      // if it doesn't have a manifest but its name ends with ".dev" - it probably dev is
      if (driverName.match(/\.dev$/)) {
        if (!this.devDependencies[pluralType][entityName]) this.devDependencies[pluralType][entityName] = [];

        this.devDependencies[pluralType][entityName].push(driverName);

        return;
      }

      throw new Error(`There is not manifest of driver "${driverName}" which is dependency of ${entityName}`);
    }

    const driverManifest: DriverManifest = drivers[driverName].manifest;

    if (driverManifest.dev) {
    //if (driverName.match(/\.dev$/)) {
      // add to devs list
      if (!this.devDependencies[pluralType][entityName]) this.devDependencies[pluralType][entityName] = [];

      this.devDependencies[pluralType][entityName].push(driverName);
    }
    else {
      // add to driver list
      if (!this.dependencies[pluralType][entityName]) this.dependencies[pluralType][entityName] = [];

      this.dependencies[pluralType][entityName].push(driverName);
    }
  }

  private generateSystemDriversList() {
    const drivers: {[index: string]: SrcEntitySet} = this.getEntitiesSet().drivers;

    for (let driverName of Object.keys(drivers)) {
      if (drivers[driverName].manifest.system) this.systemDrivers.push(driverName);
    }
  }

  private generateSystemServicesList() {
    const services: {[index: string]: SrcEntitySet} = this.getEntitiesSet().services;

    for (let serviceName of Object.keys(services)) {
      if (services[serviceName].manifest.system) this.systemServices.push(serviceName);
    }
  }

}
