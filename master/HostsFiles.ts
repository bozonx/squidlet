import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import Manifests, {ManifestsTypePluralName} from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';
import config from './config';
import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';


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
  private files: {[index: string]: HostFilesSet} = {};

  constructor(manifests: Manifests, hostsConfigGenerator: HostsConfigGenerator) {
    this.manifests = manifests;
    this.hostsConfigGenerator = hostsConfigGenerator;
  }

  // TODO: записать все во временное хранилище на мастере, чтобы сервис потом это все считал
  // TODO: разделить системные драверы + dev и остальные драйверы

  /**
   * Generate file set for each host
   */
  generate() {
    const hostsConfigs: {[index: string]: HostConfig} = this.hostsConfigGenerator.getHostsConfig();

    for (let hostId of Object.keys(hostsConfigs)) {
      const hostConfig: HostConfig = hostsConfigs[hostId];

      const devicesClasses = hostConfig.devices.map((item: DeviceDefinition) => item.className);
      const driversClasses = hostConfig.drivers.map((item: DriverDefinition) => item.className);
      const servicesClasses = hostConfig.services.map((item: ServiceDefinition) => item.className);

      this.files[hostId] = {
        config: hostConfig,
        devicesManifests: this.collectManifests<DeviceManifest>('devices', devicesClasses),
        driversManifests: this.collectManifests<DriverManifest>('drivers', driversClasses),
        servicesManifests: this.collectManifests<ServiceManifest>('services', servicesClasses),
        driversFiles: 1,
        devicesFiles: 1,
        servicesFiles: 1,
      };
    }
  }

  /**
   * Copy files for hosts to storage to dir of ConfigUpdater plugin
   */
  copyToStorage() {

  }

  /**
   * Collect all the host manifest
   * @param manifestType
   * @param manifestNames
   */
  private collectManifests<T>(manifestType: ManifestsTypePluralName, manifestNames: string[]): T[] {
    const manifests = this.manifests.getManifests() as any;
    const manifestsOfType: {[index: string]: T} = manifests[manifestType];

    return manifestNames.map((usedManifestName: string) => {
      return manifestsOfType[usedManifestName];
    });
  }

}
