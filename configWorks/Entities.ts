import {SrcEntitiesSet} from './interfaces/EntitySet';

const _omit = require('lodash/omit');
import * as path from 'path';

import Main from './Main';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import PreManifestBase from './interfaces/PreManifestBase';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import systemConfig from './configs/systemConfig';


export type ManifestsTypeName = 'device' | 'driver' | 'service';
export type ManifestsTypePluralName = 'devices' | 'drivers' | 'services';

// original or destination files
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

export interface EntitiesNames {
  devices: string[];
  drivers: string[];
  services: string[];
}

// export interface EntitiesSrcDirs {
//   devices: {[index: string]: string};
//   drivers: {[index: string]: string};
//   services: {[index: string]: string};
// }
//
// export interface EntitiesMainFiles {
//   devices: {[index: string]: string};
//   drivers: {[index: string]: string};
//   services: {[index: string]: string};
// }


export default class Entities {
  private readonly main: Main;
  private readonly entitiesDir: string;
  private entitiesSet: SrcEntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  // private devices: Map<string, DeviceManifest> = Map<string, DeviceManifest>();
  // private drivers: Map<string, DriverManifest> = Map<string, DriverManifest>();
  // private services: Map<string, ServiceManifest> = Map<string, ServiceManifest>();


  // // base dirs of entities
  // private srcDirs: EntitiesSrcDirs = {
  //   devices: {},
  //   drivers: {},
  //   services: {},
  // };
  // // relative main files of entities
  // private mainFiles: EntitiesMainFiles = {
  //   devices: {},
  //   drivers: {},
  //   services: {},
  // };
  // // relative paths of entities files
  // private filesPaths: FilesPaths = {
  //   devices: {},
  //   drivers: {},
  //   services: {},
  // };

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
    const collect = (depdOfType: {[index: string]: string[]}) => {
      for (let entityName of Object.keys(depdOfType)) {
        for (let itemName of depdOfType[entityName]) {
          result[itemName] = true;
        }
      }
    };

    // get devs from drivers
    for (let itemName of Object.keys(this.drivers.toJS())) {
      if (this.drivers.get(itemName).dev) result[itemName] = true;
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

    //this.srcDirs[pluralType][finalManifest.name] = preManifest.baseDir;

    // // add to list of manifests
    // this[pluralType] = (this[pluralType] as Map<string, FinalManifest>)
    //   .set(finalManifest.name, finalManifest);

    // if (preManifest.main) {
    //   this.mainFiles[pluralType][finalManifest.name] = preManifest.main;
    // }

    // just save unsorted deps
    if (preManifest.drivers) {
      this.unsortedDependencies[pluralType][preManifest.name] = preManifest.drivers;
    }

    // // collect files of entity which will be placed in storage
    // if (preManifest.files) {
    //   this.filesPaths[pluralType][preManifest.name] = preManifest.files;
    // }
  }

  private async prepareManifest<FinalManifest extends ManifestBase>(preManifest: PreManifestBase): Promise<FinalManifest> {
    const finalManifest: FinalManifest = _omit(
      preManifest,
      'files',
      'drivers',
      'main',
      'baseDir'
    );

    // load props file
    if (typeof preManifest.props === 'string') {
      finalManifest.props = this.main.io.loadYamlFile(preManifest.props);
    }

    return finalManifest;
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
    if (!this.drivers.get(driverName)) {
      // if it doesn't have a manifest but its name ends with ".dev" - it probably dev is
      if (driverName.match(/\.dev$/)) {
        if (!this.devDependencies[pluralType][entityName]) this.devDependencies[pluralType][entityName] = [];

        this.devDependencies[pluralType][entityName].push(driverName);

        return;
      }

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


  // private async saveEntityToStorage(
  //   preManifest: PreManifestBase,
  //   finalManifest: ManifestBase,
  //   entityDirInStorage: string,
  // ) {
  //
  //   // TODO: move to hosts files writer
  //
  //   const manifestStorageFileName = path.join(entityDirInStorage, systemConfig.hostInitCfg.fileNames.manifest);
  //
  //   if (preManifest.main) {
  //     // build an entity main file
  //
  //     // TODO: !!!!!
  //     // TODO: !!!!! test it
  //
  //     //await this.buildMainFile();
  //   }
  //
  //   if (preManifest.files) {
  //     for (let fileName of preManifest.files) {
  //       const fromFile = path.resolve(preManifest.baseDir, fileName);
  //       const toFileName = this.generateEntityFileName(entityDirInStorage, fileName);
  //
  //       // make inner dirs
  //       await this.main.io.mkdirP(path.dirname(toFileName));
  //       // copy
  //       await this.main.io.copyFile(fromFile, toFileName);
  //     }
  //   }
  //
  //   await this.main.$writeJson(manifestStorageFileName, finalManifest);
  // }

  // /**
  //  * collect files of entity which will be placed in storage
  //  */
  // private collectFiles(entityDirInStorage: string, preManifest: PreManifestBase): string[] {
  //
  //   // TODO: только files убрать main и manifest
  //
  //   const mainJsFile = path.join(entityDirInStorage, systemConfig.hostInitCfg.fileNames.mainJs);
  //
  //   return [
  //     ...(preManifest.files || [])
  //       .map((fileName: string) => this.generateEntityFileName(entityDirInStorage, fileName)),
  //     // add path to main in storage
  //     ...((preManifest.main) ? [mainJsFile] : []),
  //     // add path to parsed manifest in storage
  //     path.join(entityDirInStorage, systemConfig.hostInitCfg.fileNames.manifest),
  //   ];
  // }

  // private generateEntityFileName(entityDirInStorage: string, fileName: string): string {
  //   return path.resolve(entityDirInStorage, fileName);
  // }


  // async writeManifests<T extends ManifestBase>(entityTypeDirPath: string, manifests: T[]) {
  //   for (let manifest of manifests) {
  //     const fileName = path.join(
  //       entityTypeDirPath,
  //       manifest.name,
  //       systemConfig.hostInitCfg.fileNames.manifest
  //     );
  //
  //     //await this.writeJson(fileName, manifest);
  //   }
  // }
  //
  // async copyEntityFiles(entityTypeDirPath: string, fileSet: {[index: string]: string[]}) {
  //   for (let entityClassName of Object.keys(fileSet)) {
  //     for (let fromFileName of fileSet[entityClassName]) {
  //       const toFileName = path.join(
  //         entityTypeDirPath,
  //         entityClassName,
  //         path.basename(fromFileName),
  //       );
  //
  //       await this.main.io.mkdirP(path.dirname(toFileName));
  //
  //       await this.main.io.copyFile(fromFileName, toFileName);
  //     }
  //   }
  // }


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
