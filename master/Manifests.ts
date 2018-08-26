const _omit = require('lodash/omit');
const _map = require('lodash/map');

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

interface AllManifests {
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

  // TODO: не нужно !!!!
  getDevicesManifests(): DeviceManifest[] {
    return _map(this.devices.toJS());
  }

  // TODO: не нужно !!!!
  getDriversManifests(): DriverManifest[] {
    return _map(this.drivers.toJS());
  }

  // TODO: не нужно !!!!
  getServicesManifests(): ServiceManifest[] {
    return _map(this.services.toJS());
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
      for (let driverPath of preManifest.drivers) {
        await this.proceedDriverManifest(driverPath);
      }
    }

    // add to list of manifests
    finalManifests.set(finalManifest.name, finalManifest);
  }

  private prepareManifest<PreManifestBase, FinalManifest>(preManifest: PreManifestBase): FinalManifest {
    const finalManifest: FinalManifest = _omit(preManifest, 'files', 'drivers');


    // TODO: merge props with config defaults
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига

    return finalManifest;
  }

  private async proceedDriverManifest(driverManifestPath: string) {

    // TODO: поидее можно сравнивать по baseDir - чтобы не подгружать файл
    // TODO: не оптимально что сначала загружается файл чтобы понять имя манифеста чтобы понять
    //       был ли он загружен или нет - лучше наверное сравнивать по resolved имени файла

    const parsedManifest: PreDeviceManifest = await this.loadManifest<PreDeviceManifest>(driverManifestPath);

    // if driver is registered - do nothing
    if (this.drivers.get(parsedManifest.name)) return;

    // proceed it
    return this.proceed<PreDeviceManifest, DriverManifest>('driver', parsedManifest);
  }

  private async loadManifest<T extends PreManifestBase>(resolvedPathToManifest: string): Promise<T> {
    return await loadManifest<T>(resolvedPathToManifest);
  }

}
