const _omit = require('lodash/omit');
import * as path from 'path';
import {Map} from 'immutable';

import Main from './Main';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import PreManifestBase from './interfaces/PreManifestBase';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import systemConfig from './configs/systemConfig';


export type ManifestsTypeName = 'device' | 'driver' | 'service';
export type ManifestsTypePluralName = 'devices' | 'drivers' | 'services';

export interface FilesPaths {
  // list of devices files by device name
  devices: {[index: string]: string[]};
  // list of drivers files by driver name
  drivers: {[index: string]: string[]};
  // list of services files by service name
  services: {[index: string]: string[]};
}

export interface Dependencies {
  // list of dependencies of devices by device name
  devices: {[index: string]: string[]};
  // list of dependencies of drivers by driver name
  drivers: {[index: string]: string[]};
  // list of dependencies of services by service name
  services: {[index: string]: string[]};
}

export interface AllManifests {
  devices: {[index: string]: DeviceManifest};
  drivers: {[index: string]: DriverManifest};
  services: {[index: string]: ServiceManifest};
}


export default class Entities {
  private readonly main: Main;
  private devices: Map<string, DeviceManifest> = Map<string, DeviceManifest>();
  private drivers: Map<string, DriverManifest> = Map<string, DriverManifest>();
  private services: Map<string, ServiceManifest> = Map<string, ServiceManifest>();
  // file paths collected from manifests
  private filesPaths: FilesPaths = {
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
  private devDependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  private systemDrivers: string[] = [];
  private systemServices: string[] = [];

  // TODO: make it
  // list of used devs - dependencies or manifests
  private devs: string[] = [];


  constructor(main: Main) {
    this.main = main;
  }

  getManifests(): AllManifests {
    return {
      devices: this.devices.toJS(),
      drivers: this.drivers.toJS(),
      services: this.services.toJS(),
    };
  }

  getFiles(): FilesPaths {
    return this.filesPaths;
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

  getDevs(): string[] {
    return this.devs;
  }

  async generate() {
    const preDevicesManifests = this.main.register.getDevicesPreManifests();
    const prePreDriverManifest = this.main.register.getDriversPreManifests();
    const prePreServiceManifest = this.main.register.getServicesPreManifests();

    for (let item of preDevicesManifests) {
      await this.proceed<PreDeviceManifest, DeviceManifest>('device', item);
    }

    for (let item of prePreDriverManifest) {
      await this.proceed<PreDriverManifest, DriverManifest>('driver', item);
    }

    for (let item of prePreServiceManifest) {
      await this.proceed<PreServiceManifest, ServiceManifest>('service', item);
    }

    // sort deps drivers and devs and save they to separate list
    this.sortDependencies();
    this.generateSystemDriversList();
    this.generateSystemServicesList();
  }


  private async proceed<PreManifest extends PreManifestBase, FinalManifest extends ManifestBase>(
    manifestType: ManifestsTypeName,
    preManifest: PreManifest,
  ) {
    const pluralType = `${manifestType}s` as ManifestsTypePluralName;

    // collect files
    // TODO: навреное можно перенести в register превращение в absolute path
    const files: string[] = this.collectFiles(preManifest.baseDir, preManifest.files || []);

    if (preManifest.main) {
      // TODO: навреное можно перенести в register превращение в absolute path
      const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);
      const jsMainFileName = this.generateJsMainFileName(pluralType, preManifest.name);

      // build an entity main file
      await this.buildMainFile(absoluteMainFileName, jsMainFileName);

      files.push(jsMainFileName);
    }

    // TODO: сформировать папки манифестов по типам - в каждой папке все необходимое - на них будут указывать пути для копирования
    // TODO: на них будут указывать пути для копирования
    // TODO: добавить сюда пути на сам manifest.json

    if (files.length) this.filesPaths[pluralType][preManifest.name] = files;

    // just save unsorted deps
    if (preManifest.drivers) {
      this.unsortedDependencies[pluralType][preManifest.name] = preManifest.drivers;
    }

    // prepare to add to list of manifests
    const finalManifest: FinalManifest = await this.prepareManifest<FinalManifest>(preManifest);
    const manifestsSet = this[pluralType] as Map<string, FinalManifest>;

    // add to list of manifests
    this[pluralType] = manifestsSet.set(finalManifest.name, finalManifest);
  }

  private collectFiles(baseDir: string, paths: string[]): string[] {
    return paths.map((item) => {
      // TODO: поидее можно это перенести в валидацию во время register.addEntity
      if (path.isAbsolute(item)) {
        throw new Error(`You must not specify an absolute path of "${item}". Only relative is allowed.`);
      }
      else if (item.match(/\.\./)) {
        throw new Error(`Path "${item}" has to relative to its manifest base dir`);
      }

      return path.resolve(baseDir, item);
    });
  }

  private async prepareManifest<FinalManifest extends ManifestBase>(preManifest: PreManifestBase): Promise<FinalManifest> {
    const finalManifest: FinalManifest = _omit(
      preManifest,
      'files',
      'drivers',
      'main',
      'baseDir'
    );

    if (typeof preManifest.props === 'string') {
      finalManifest.props = this.main.io.loadYamlFile(preManifest.props);
    }

    return finalManifest;
  }

  private generateJsMainFileName(pluralType: string, entityName: string): string {
    return path.join(
      this.main.buildDir,
      systemConfig.entityBuildDir,
      `${pluralType}_${entityName}.js`
    );
  }

  private async buildMainFile(absoluteMainFileName: string, jsFileName: string) {
    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл
    // TODO: !!!!! поддержка билда js файлов

  }

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
    //if (!driverName.match(/\.dev$/) && !this.drivers.get(driverName)) {
    if (!this.drivers.get(driverName)) {
      throw new Error(`There is not manifest of driver "${driverName}" which is dependency of ${entityName}`);
    }

    const driverManifest: DriverManifest = this.drivers.get(driverName);

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
    const drivers: {[index: string]: DriverManifest} = this.drivers.toJS();

    for (let driverName of Object.keys(drivers)) {
      if (drivers[driverName].system) this.systemDrivers.push(driverName);
    }
  }

  private generateSystemServicesList() {
    const services: {[index: string]: ServiceManifest} = this.services.toJS();

    for (let serviceName of Object.keys(services)) {
      if (services[serviceName].system) this.systemServices.push(serviceName);
    }
  }

  async writeManifests<T extends ManifestBase>(entityTypeDirPath: string, manifests: T[]) {
    for (let manifest of manifests) {
      const fileName = path.join(
        entityTypeDirPath,
        manifest.name,
        systemConfig.hostInitCfg.fileNames.manifest
      );

      //await this.writeJson(fileName, manifest);
    }
  }

  async copyEntityFiles(entityTypeDirPath: string, fileSet: {[index: string]: string[]}) {
    for (let entityClassName of Object.keys(fileSet)) {
      for (let fromFileName of fileSet[entityClassName]) {
        const toFileName = path.join(
          entityTypeDirPath,
          entityClassName,
          path.basename(fromFileName),
        );

        await this.main.io.mkdirP(path.dirname(toFileName));

        await this.main.io.copyFile(fromFileName, toFileName);
      }
    }
  }


  // /**
  //  * Collect all the used host manifest of devices, drivers or services
  //  */
  // private collectManifests<T>(manifestPluralType: ManifestsTypePluralName, usedEntityNames: string[]): T[] {
  //   const allManifests = this.main.manifests.getManifests() as any;
  //   const allManifestsOfType: {[index: string]: T} = allManifests[manifestPluralType];
  //
  //   return usedEntityNames.map((usedEntityName: string) => allManifestsOfType[usedEntityName]);
  // }
  //
  // /**
  //  * Collect all the used host files of devices, drivers or services
  //  */
  // private collectFiles(
  //   manifestPluralType: ManifestsTypePluralName,
  //   entityNames: string[]
  // ): {[index: string]: string[]} {
  //   const files = this.main.manifests.getFiles()[manifestPluralType];
  //   // files paths by entity name
  //   const result: {[index: string]: string[]} = {};
  //
  //   for (let usedEntityName of entityNames) {
  //     result[usedEntityName] = files[usedEntityName];
  //   }
  //
  //   return result;
  // }

}
