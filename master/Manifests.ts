const _omit = require('lodash/omit');

import {loadManifest} from './IO';
import {Map} from 'immutable';

import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import PreManifestBase from './interfaces/PreManifestBase';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';


export type ManifestsTypePluralName = 'devices' | 'drivers' | 'services';

interface FilesPaths {
  // list of devices files by device name
  devices: {[index: string]: string[]};
  // list of drivers files by driver name
  drivers: {[index: string]: string[]};
  // list of services files by service name
  services: {[index: string]: string[]};
}

interface Dependencies {
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
  private devices: Map<string, DeviceManifest> = Map<string, DeviceManifest>();
  private drivers: Map<string, DriverManifest> = Map<string, DriverManifest>();
  private services: Map<string, ServiceManifest> = Map<string, ServiceManifest>();
  // file paths collected from manifests
  private filesPaths: FilesPaths = {
    devices: {},
    drivers: {},
    services: {},
  };
  private dependencies: Dependencies = {
    devices: {},
    drivers: {},
    services: {},
  };
  // driver names by soft paths to manifest or dir with manifest like {softPath: DriverName}
  private driversSoftPaths: {[index: string]: string} = {};

  constructor() {
  }

  getManifests(): AllManifests {
    return {
      devices: this.devices.toJS(),
      drivers: this.drivers.toJS(),
      services: this.services.toJS(),
    };
  }

  getFiles(): FilesPaths {
    // TODO: clone or immutable

    return this.filesPaths;
  }

  getDependencies(): Dependencies {
    return this.dependencies;
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
  }


  private async proceed<PreManifest extends PreManifestBase, FinalManifest extends ManifestBase>(
    manifestType: string,
    preManifest: PreManifest
  ) {
    const finalManifest: FinalManifest = this.prepareManifest(preManifest);
    const plural: ManifestsTypePluralName = `${manifestType}s` as ManifestsTypePluralName;
    const finalManifests = this[plural] as Map<string, FinalManifest>;

    // collect files
    this.filesPaths[plural][preManifest.name] = [
      preManifest.main,
      ...preManifest.files || [],
    ];

    // proceed drivers
    if (preManifest.drivers) {
      for (let driverSoftPath of preManifest.drivers) {
        await this.proceedDriverManifest(driverSoftPath);
      }
    }

    if (preManifest.drivers) {
      this.dependencies[plural][preManifest.name] = this.collectDependencies<PreManifest>(preManifest);
    }

    // add to list of manifests
    finalManifests.set(finalManifest.name, finalManifest);
  }

  private collectDependencies<PreManifest extends PreManifestBase>(preManifest: PreManifest): string[] {
    if (!preManifest.drivers) return [];

    return preManifest.drivers.map((softPath: string) => {
      if (!this.driversSoftPaths[softPath]) {
        throw new Error(`Can't find driver name by softPath "${softPath}"`);
      }

      // TODO: наверное dev исключить, так как они должны быть на хосте уже

      return this.driversSoftPaths[softPath];
    });
  }

  private prepareManifest<PreManifestBase, FinalManifest>(preManifest: PreManifestBase): FinalManifest {
    const finalManifest: FinalManifest = _omit(preManifest, 'files', 'drivers');


    // TODO: merge props with config defaults
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига

    return finalManifest;
  }

  private async proceedDriverManifest(driverManifestSoftPath: string) {
    // TODO: наверное dev исключить

    // TODO: поидее можно сравнивать по baseDir - чтобы не подгружать файл
    // TODO: не оптимально что сначала загружается файл чтобы понять имя манифеста чтобы понять
    //       был ли он загружен или нет - лучше наверное сравнивать по resolved имени файла

    const parsedManifest: PreDeviceManifest = await this.loadManifest<PreDeviceManifest>(driverManifestSoftPath);

    // if driver is registered - do nothing
    if (this.drivers.get(parsedManifest.name)) return;
    // save soft paths cache
    this.driversSoftPaths[driverManifestSoftPath] = parsedManifest.name;

    // proceed it
    return this.proceed<PreDeviceManifest, DriverManifest>('driver', parsedManifest);
  }

  private async loadManifest<T extends PreManifestBase>(resolvedPathToManifest: string): Promise<T> {
    return await loadManifest<T>(resolvedPathToManifest);
  }

}
