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


export type ManifestsTypeName = 'device' | 'driver' | 'service';
export type ManifestsTypePluralName = 'devices' | 'drivers' | 'services';

interface FilesPaths {
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


export default class Manifests {
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

  async generate(
    preDevicesManifests: PreDeviceManifest[],
    prePreDriverManifest: PreDriverManifest[],
    prePreServiceManifest: PreServiceManifest[]
  ) {
    for (let item of preDevicesManifests) {
      await this.proceed<PreDeviceManifest, DeviceManifest>('device', item);
    }

    for (let item of prePreDriverManifest) {
      await this.proceed<PreDriverManifest, DriverManifest>('driver', item);
    }

    for (let item of prePreServiceManifest) {
      await this.proceed<PreServiceManifest, ServiceManifest>('device', item);
    }

    this.validateDeps();
    this.generateSystemDriversList();
    this.generateSystemServicesList();
  }


  private async proceed<PreManifest extends PreManifestBase, FinalManifest extends ManifestBase>(
    manifestType: ManifestsTypeName,
    preManifest: PreManifest
  ) {
    const pluralType = `${manifestType}s` as ManifestsTypePluralName;
    const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);
    const tmpMainFileName = this.generateTmpMainFileName(absoluteMainFileName);

    // build an entity main file
    await this.buildMainFile(absoluteMainFileName, tmpMainFileName);

    // collect files
    this.filesPaths[pluralType][preManifest.name] = [
      tmpMainFileName,
      ...this.collectFiles(preManifest.baseDir, preManifest.files || []),
    ];

    // sort deps drivers and devs and save they
    this.proceedDependencies(pluralType, preManifest);

    // prepare to add to list of manifests
    const finalManifest: FinalManifest = this.prepareManifest(preManifest);
    const manifestsSet = this[pluralType] as Map<string, FinalManifest>;

    // add to list of manifests
    manifestsSet.set(finalManifest.name, finalManifest);
  }

  private collectFiles(baseDir: string, paths: string[]): string[] {
    return paths.map((item) => {
      if (item.indexOf('/') === 0) {
        throw new Error(`You must not specify an absolute path of "${item}". Only relative is allowed.`);
      }
      else if (item.match(/\.\./)) {
        throw new Error(`Path "${item}" has to relative to its manifest base dir`);
      }

      return path.resolve(baseDir, item);
    });
  }

  private proceedDependencies(pluralType: ManifestsTypePluralName, preManifest: PreManifestBase) {
    if (!preManifest.drivers) return;

    preManifest.drivers.map((driverName: string) => {
      if (driverName.match(/\.dev$/)) {
        // add to devs list
        if (!this.dependencies[pluralType][preManifest.name]) {
          this.dependencies[pluralType][preManifest.name] = [];
        }

        this.dependencies[pluralType][preManifest.name].push(driverName);
      }
      else {
        // add to driver list
        if (!this.devDependencies[pluralType][preManifest.name]) {
          this.devDependencies[pluralType][preManifest.name] = [];
        }

        this.devDependencies[pluralType][preManifest.name].push(driverName);
      }
    });
  }

  private prepareManifest<PreManifestBase, FinalManifest>(preManifest: PreManifestBase): FinalManifest {
    const finalManifest: FinalManifest = _omit(
      preManifest,
      'files',
      'drivers',
      'props',
      'main',
    );


    // TODO: merge props with config defaults
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига

    return finalManifest;
  }

  private generateTmpMainFileName(absoluteMainFileName: string): string {
    // TODO: !!!!! вернуть имя файла во временной папке
  }

  private async buildMainFile(absoluteMainFileName: string, jsFileName: string) {
    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл

  }

  private validateDeps() {
    const validateType = (dictByName: {[index: string]: string[]}) => {
      for (let entityName of Object.keys(dictByName)) {
        for (let driverName of dictByName[entityName]) {
          if (!this.drivers.get(driverName)) {
            throw new Error(`There is not manifest of driver "${driverName}" which is dependency of ${entityName}`);
          }
        }
      }
    };

    validateType(this.dependencies.devices);
    validateType(this.dependencies.drivers);
    validateType(this.dependencies.services);
  }

  private generateSystemDriversList() {
    // TODO: !!!!
  }

  private generateSystemServicesList() {
    // TODO: !!!!
  }

}



// // registering
// if (preManifest.drivers) {
//   for (let driverSoftPath of preManifest.drivers) {
//     await this.proceedDriverManifest(driverSoftPath);
//   }
// }

// private async proceedDriverManifest(driverManifestSoftPath: string) {
//   // TODO: наверное dev исключить
//
//   // TODO: поидее можно сравнивать по baseDir - чтобы не подгружать файл
//   // TODO: не оптимально что сначала загружается файл чтобы понять имя манифеста чтобы понять
//   //       был ли он загружен или нет - лучше наверное сравнивать по resolved или softPath имени файла
//
//   // it add a baseDir param
//   const parsedManifest: PreDeviceManifest = await this.main.$loadManifest<PreDeviceManifest>(driverManifestSoftPath);
//
//   // if driver is registered - do nothing
//   if (this.drivers.get(parsedManifest.name)) return;
//   // save soft paths cache
//   this.driversSoftPaths[driverManifestSoftPath] = parsedManifest.name;
//
//   // proceed it
//   return this.proceed<PreDeviceManifest, DriverManifest>('driver', parsedManifest);
// }
