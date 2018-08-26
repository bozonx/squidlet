import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';


interface HostFilesSet {
  config: HostConfig;
  devicessManifests: DeviceManifest[];
  driversManifests: DriverManifest[];
  servicesManifests: ServiceManifest[];
  driversFiles: {[index: string]: string[]};
  devicesFiles: {[index: string]: string[]};
  servicesFiles: {[index: string]: string[]};
}


export default class HostsFiles {
  private files: {[index: string]: HostFilesSet};

  constructor() {
  }

  // TODO: собрать конфиг, манифесты и список файлов для каждого хоста
  // TODO: добавить платформозависимые dev

  // TODO: !!!! add devs specified to platform
  // TODO: записать все во временное хранилище на мастере, чтобы сервис потом это все считал
  // TODO: разделить системные драверы + dev и остальные драйверы

  generate() {

  }

  private copyToStorage() {

  }

}
