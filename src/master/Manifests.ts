const _omit = require('lodash/omit');
import {List} from 'immutable';

import DeviceManifest from '../app/interfaces/DeviceManifest';
import DriverManifest from '../app/interfaces/DriverManifest';
import ServiceManifest from '../app/interfaces/ServiceManifest';
import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import PreManifestBase from './interfaces/PreManifestBase';
import ManifestBase from '../app/interfaces/ManifestBase';


type PluralName = 'devices' | 'drivers' | 'services';

interface FilesPaths {
  // list of devices files by device name
  devices: {[index: string]: string[]};
  // list of drivers files by driver name
  drivers: {[index: string]: string[]};
  // list of services files by service name
  services: {[index: string]: string[]};
}


export default class Manifests {
  private devices: List<DeviceManifest> = List<DeviceManifest>();
  private drivers: List<DriverManifest> = List<DriverManifest>();
  private services: List<ServiceManifest> = List<ServiceManifest>();
  // file paths collected from manifests
  private filesPaths: FilesPaths = {
    devices: {},
    drivers: {},
    services: {},
  };

  constructor() {
  }

  getDevicesManifests(): DeviceManifest[] {
    return this.devices.toArray();
  }

  getDriversManifests(): DriverManifest[] {
    return this.drivers.toArray();
  }

  getServicesManifests(): ServiceManifest[] {
    return this.services.toArray();
  }

  prepare(
    preDevicesManifests: PreDeviceManifest[],
    prePreDriverManifest: PreDriverManifest[],
    prePreServiceManifest: PreServiceManifest[]
  ) {
    for (let item of preDevicesManifests) {
      this.proceed<PreDeviceManifest, DeviceManifest>('device', item);
    }

    for (let item of prePreDriverManifest) {
      this.proceed<PreDriverManifest, DriverManifest>('driver', item);
    }

    for (let item of prePreServiceManifest) {
      this.proceed<PreServiceManifest, ServiceManifest>('device', item);
    }
  }


  private proceed<PreManifest extends PreManifestBase, FinalManifest extends ManifestBase>(
    manifestType: string,
    preManifest: PreManifest
  ) {
    const finalManifest: FinalManifest = this.prepareManifest(preManifest);
    const plural: PluralName = `${manifestType}s` as PluralName;
    const finalManifests = this[plural] as List<FinalManifest>;

    // collect files
    this.filesPaths[plural][preManifest.name] = [
      preManifest.main,
      ...preManifest.files || [],
    ];

    // proceed drivers
    if (preManifest.drivers) {
      for (let driverPath of preManifest.drivers) {
        this.proceedDriverManifest(driverPath);
      }
    }

    // add to list of manifests
    finalManifests.push(finalManifest);
  }

  private prepareManifest<PreManifestBase, FinalManifest>(preManifest: PreManifestBase): FinalManifest {
    const finalManifest: FinalManifest = _omit(preManifest, 'files', 'drivers');


    // TODO: merge props with config defaults
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига


    return finalManifest;
  }

  private proceedDriverManifest(driverPath: string) {
    // TODO: load driver manifest
    // TODO: if driver is registered - do nothing
    // TODO: run proceed
  }

}
