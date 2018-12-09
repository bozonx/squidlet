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
import {ManifestsTypeName, ManifestsTypePluralName} from './interfaces/ManifestTypes';


// dependencies of entities by class name
export interface Dependencies {
  devices: {[index: string]: string[]};
  drivers: {[index: string]: string[]};
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
  // Entities set which contains a srcDir which point to dir where original manifest places.
  // There are all the entities which was registered in the system.
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };
  // temporary driver and devs deps list like {type: {ClassName: [...DriverName]}}
  // there is just content of "drivers" param of manifest
  private manifestsDriversParams: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  // driver deps like {type: {ClassName: [...DriverName]}}. Exclude devs
  private dependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  // list of devs like {type: {ClassName: [...DriverName]}}
  // they have param "dev" in a manifest or if it doesn't have a manifest its name ends with ".dev".
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

  /**
   * Get drivers dependencies. Without devs
   */
  getDependencies(): Dependencies {
    return this.dependencies;
  }

  /**
   * Get only devs dependencies
   */
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
   * Get all the devs class names.
   * Collect they from drivers and all the dependencies
   */
  getDevs(): string[] {
    const result: {[index: string]: true} = {};
    const drivers: {[index: string]: SrcEntitySet} = this.getEntitiesSet().drivers;

    const collect = (depsOfType: {[index: string]: string[]}) => {
      for (let entityName of Object.keys(depsOfType)) {
        for (let itemName of depsOfType[entityName]) {
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
    const preDriverManifests = this.main.register.getDriversPreManifests();
    const preServiceManifests = this.main.register.getServicesPreManifests();

    for (let item of preDevicesManifests) {
      await this.proceed<DeviceManifest>('device', item);
    }

    for (let item of preDriverManifests) {
      await this.proceed<DriverManifest>('driver', item);
    }

    for (let item of preServiceManifests) {
      await this.proceed<ServiceManifest>('service', item);
    }

    // sort deps drivers and devs and save they to separate list
    this.sortDependencies();
    this.generateSystemDriversList();
    this.generateSystemServicesList();
  }


  /**
   * Proceed device, driver or service. It makes EntitySet and saves dependencies of entity.
   */
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
      this.manifestsDriversParams[pluralType][preManifest.name] = preManifest.drivers;
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
      const propPath = path.join(preManifest.baseDir, preManifest.props);
      finalManifest.props = await this.main.io.loadYamlFile(propPath);
    }

    return finalManifest;
  }

  /**
   * Sort dependencies to drivers and devs
   */
  private sortDependencies() {
    const sortType = (pluralType: ManifestsTypePluralName) => {
      const dictByName: {[index: string]: string[]} = this.manifestsDriversParams[pluralType];

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
    if (this.isDev(pluralType, entityName, driverName)) {
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

  isDev(pluralType: ManifestsTypePluralName, entityName: string, driverName: string): boolean {
    const drivers: {[index: string]: SrcEntitySet} = this.getEntitiesSet().drivers;

    if (!drivers[driverName]) {
      // if it doesn't have a manifest but its name ends with ".dev" - it is probably dev
      if (driverName.match(/\.dev$/)) {
        return true;
      }

      throw new Error(`There is not manifest of driver "${driverName}" which is dependency of ${entityName}`);
    }

    const driverManifest: DriverManifest = drivers[driverName].manifest;

    //if (driverName.match(/\.dev$/)) {

    return Boolean(driverManifest.dev);
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
