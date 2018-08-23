import {Map} from 'immutable';

import DeviceManifest from '../app/interfaces/DeviceManifest';
import DriverManifest from '../app/interfaces/DriverManifest';
import ServiceManifest from '../app/interfaces/ServiceManifest';


interface FilesPaths {
  // list of devices files by device name
  devices: {[index: string]: string[]};
  // list of drivers files by driver name
  drivers: {[index: string]: string[]};
  // list of services files by service name
  services: {[index: string]: string[]};
}

interface Props {
  // devices props by device name
  devices: {[index: string]: {[index: string]: any}};
  // drivers props by driver name
  drivers: {[index: string]: {[index: string]: any}};
  // services props by service name
  services: {[index: string]: {[index: string]: any}};
}


export default class Manifests {
  private devicesManifests: Map<string, DeviceManifest> = Map<string, DeviceManifest>();
  private driversManifests: Map<string, DriverManifest> = Map<string, DriverManifest>();
  private servicesManifests: Map<string, ServiceManifest> = Map<string, ServiceManifest>();
  // file paths collected from manifests
  private filesPaths: FilesPaths = {
    devices: {},
    drivers: {},
    services: {},
  };
  // props from manifests
  private props: Props = {
    devices: {},
    drivers: {},
    services: {},
  };

  constructor() {

  }

  prepare() {
    // TODO: collect props
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига
  }

  private resolve() {
    // TODO: как обрабатывать дубли?
    // TODO: пройтись по всем манифестам и искать там drivers
    // TODO: рукурсивно проходиться по полям drivers в манифестах драйверов
  }

}
