import * as path from 'path';

import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import HostsConfigsSet from './HostsConfigsSet';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import HostFilesSet from './interfaces/HostFilesSet';
import HostsFilesSet from './HostsFilesSet';
import systemConfig from './configs/systemConfig';
import {copyFile, writeFile} from './IO';


export default class HostsFilesWriter {
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsConfigSet: HostsConfigsSet;

  private get baseDir(): string {
    // TODO: move to constructor ???
    // TODO: review
    const hostsConfigs: {[index: string]: HostConfig} = this.hostsConfigSet.getHostsConfigs();
    const pathToStoreOnMaster: string = hostsConfigs.master.host.storageDir;
    // TODO: review
    return path.join(pathToStoreOnMaster, systemConfig.pathToSaveHostsFileSet);
  }

  constructor(hostsFilesSet: HostsFilesSet, hostsConfigSet: HostsConfigsSet) {
    this.hostsFilesSet = hostsFilesSet;
    this.hostsConfigSet = hostsConfigSet;
  }

  /**
   * Copy files for hosts to storage to store of master
   */
  async writeToStorage() {
    const filesCollection: {[index: string]: HostFilesSet} = this.hostsFilesSet.getCollection();

    for (let hostId of Object.keys(filesCollection)) {
      await this.proceedHost(hostId, filesCollection[hostId]);
    }
  }


  private async proceedHost(hostId: string, hostFileSet: HostFilesSet) {
    const hostDir = path.join(this.baseDir, hostId);
    const devicesPath = path.join(hostDir, systemConfig.hostInitCfg.hostDirs.devices);
    const driversPath = path.join(hostDir, systemConfig.hostInitCfg.hostDirs.drivers);
    const servicesPath = path.join(hostDir, systemConfig.hostInitCfg.hostDirs.services);

    // TODO: создать папку хранилища, девайсов, драйверов и тд

    await this.writeHostConfig(hostDir, hostFileSet.config);

    await this.writeManifests<DeviceManifest>(devicesPath, hostFileSet.devicesManifests);
    await this.writeManifests<DriverManifest>(driversPath, hostFileSet.driversManifests);
    await this.writeManifests<ServiceManifest>(servicesPath, hostFileSet.servicesManifests);

    await this.copyEntityFiles(devicesPath, hostFileSet.devicesFiles);
    await this.copyEntityFiles(driversPath, hostFileSet.driversFiles);
    await this.copyEntityFiles(servicesPath, hostFileSet.servicesFiles);

    //await this.writeJson(, hostFileSet.systemDrivers);
    // TODO: add a new items
  }

  private async writeHostConfig(hostPath: string, hostConfig: HostConfig) {
    const fileName = path.join(hostPath, systemConfig.hostInitCfg.hostDirs.config, systemConfig.hostInitCfg.fileNames.hostConfig);
    const content = JSON.stringify(hostConfig);

    await writeFile(fileName, content);
  }

  async writeManifests<T extends ManifestBase>(entityTypeDirPath: string, manifests: T[]) {
    for (let manifest of manifests) {
      // TODO: use file name from config
      const fileName = path.join(entityTypeDirPath, `${manifest.name}.json`);
      const content = JSON.stringify(manifest);

      await writeFile(fileName, content);
    }
  }

  async copyEntityFiles(entityTypeDirPath: string, fileSet: {[index: string]: string[]}) {
    for (let entityClassName of Object.keys(fileSet)) {
      for (let fromFileName of fileSet[entityClassName]) {
        const toFileName = path.join(entityTypeDirPath, entityClassName);

        await copyFile(fromFileName, toFileName);
      }
    }
  }

}
