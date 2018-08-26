import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import Manifests from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';


interface HostFilesSet {
  config: HostConfig;
  devicesManifests: DeviceManifest[];
  driversManifests: DriverManifest[];
  servicesManifests: ServiceManifest[];
  driversFiles: {[index: string]: string[]};
  devicesFiles: {[index: string]: string[]};
  servicesFiles: {[index: string]: string[]};
}


export default class HostsFiles {
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  // file sets by hostId
  private files: {[index: string]: HostFilesSet};

  constructor(manifests: Manifests, hostsConfigGenerator: HostsConfigGenerator) {
    this.manifests = manifests;
    this.hostsConfigGenerator = hostsConfigGenerator;

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
