import {Map} from 'immutable';

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

// interface Props {
//   // devices props by device name
//   devices: {[index: string]: {[index: string]: any}};
//   // drivers props by driver name
//   drivers: {[index: string]: {[index: string]: any}};
//   // services props by service name
//   services: {[index: string]: {[index: string]: any}};
// }


export default class Manifests {
  private devices: DeviceManifest[] = [];
  private drivers: DriverManifest[] = [];
  private services: ServiceManifest[] = [];
  // file paths collected from manifests
  private filesPaths: FilesPaths = {
    devices: {},
    drivers: {},
    services: {},
  };

  // // props from manifests
  // private props: Props = {
  //   devices: {},
  //   drivers: {},
  //   services: {},
  // };

  constructor() {

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

  proceed<PreManifest extends PreManifestBase, ProcessedManifest extends ManifestBase>(
    manifestType: string,
    manifest: PreManifest
  ) {
    const processedManifest: PreManifest = { ...manifest as object } as PreManifest;
    const plural: PluralName = `${manifestType}s` as PluralName;

    // collect files
    this.filesPaths[plural][manifest.name] = [
      manifest.main,
      ...manifest.files || [],
    ];
    // remove files list from manifest
    delete processedManifest.files;

    // TODO: merge props with config defaults
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига

    // proceed drivers
    if (manifest.drivers) {
      for (let driverPath of manifest.drivers) {
        // TODO: load driver manifest
        // TODO: if driver is registered - do nothing
        // TODO: run proceed
      }
    }

    // remove drivers list from manifest
    delete processedManifest.drivers;

    const processedManifests = this[plural] as PreManifest[];

    processedManifests.push(processedManifest as PreManifest);
  }

}
