import * as path from 'path';

import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import Manifests, {ManifestsTypePluralName} from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';
import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';
import config from './config';


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
        driversFiles: this.collectFiles('devices', devicesClasses),
        devicesFiles: this.collectFiles('drivers', driversClasses),
        servicesFiles: this.collectFiles('services', servicesClasses),
      };
    }
  }

  /**
   * Copy files for hosts to storage to dir of ConfigUpdater plugin
   */
  async copyToStorage() {
    const hostsConfigs: {[index: string]: HostConfig} = this.hostsConfigGenerator.getHostsConfig();
    const pathToStoreOnMaster: string = hostsConfigs.master.host.storageDir;
    const basePath = path.join(pathToStoreOnMaster, config.pathToSaveHostsFileSet);

    for (let hostId of Object.keys(this.files)) {
      const hostFileSet: HostFilesSet = this.files[hostId];
      const hostPath = path.join(basePath, hostId);


    }
  }

  /**
   * Collect all the host manifest
   */
  private collectManifests<T>(manifestType: ManifestsTypePluralName, entityNames: string[]): T[] {
    const manifests = this.manifests.getManifests() as any;
    const manifestsOfType: {[index: string]: T} = manifests[manifestType];

    return entityNames.map((usedEntityName: string) => manifestsOfType[usedEntityName]);
  }

  /**
   * Collect all the host files
   */
  private collectFiles(
    manifestType: ManifestsTypePluralName,
    entityNames: string[]
  ): {[index: string]: string[]} {
    const files = this.manifests.getFiles()[manifestType];
    // files paths by entity name
    const result: {[index: string]: string[]} = {};

    for (let usedEntityName of entityNames) {
      result[usedEntityName] = files[usedEntityName];
    }

    return result;
  }

}
