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
    const hostDirs = systemConfig.hostInitCfg.hostDirs;
    const fileNames = systemConfig.hostInitCfg.fileNames;

    const configDir = path.join(hostDir, hostDirs.config);
    const devicesPath = path.join(hostDir, hostDirs.devices);
    const driversPath = path.join(hostDir, hostDirs.drivers);
    const servicesPath = path.join(hostDir, hostDirs.services);

    await this.writeHostConfig(configDir, hostFileSet.config);

    await this.writeManifests<DeviceManifest>(devicesPath, hostFileSet.devicesManifests);
    await this.writeManifests<DriverManifest>(driversPath, hostFileSet.driversManifests);
    await this.writeManifests<ServiceManifest>(servicesPath, hostFileSet.servicesManifests);

    await this.copyEntityFiles(devicesPath, hostFileSet.devicesFiles);
    await this.copyEntityFiles(driversPath, hostFileSet.driversFiles);
    await this.copyEntityFiles(servicesPath, hostFileSet.servicesFiles);

    await this.writeJson(path.join(configDir, fileNames.systemDrivers), hostFileSet.systemDrivers);
    await this.writeJson(path.join(configDir, fileNames.regularDrivers), hostFileSet.regularDrivers);
    await this.writeJson(path.join(configDir, fileNames.systemServices), hostFileSet.systemServices);
    await this.writeJson(path.join(configDir, fileNames.regularServices), hostFileSet.regularServices);

    await this.writeJson(path.join(configDir, fileNames.devicesDefinitions), hostFileSet.devicesDefinitions);
    await this.writeJson(path.join(configDir, fileNames.driversDefinitions), hostFileSet.driversDefinitions);
    await this.writeJson(path.join(configDir, fileNames.servicesDefinitions), hostFileSet.servicesDefinitions);
  }

  private async writeHostConfig(configDir: string, hostConfig: HostConfig) {
    const fileName = path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig);

    // TODO: создать папку - hostId/config

    await this.writeJson(fileName, hostConfig);
  }

  async writeManifests<T extends ManifestBase>(entityTypeDirPath: string, manifests: T[]) {
    for (let manifest of manifests) {
      const fileName = path.join(
        entityTypeDirPath,
        manifest.name,
        systemConfig.hostInitCfg.fileNames.manifest
      );

      // TODO: создать папку - entityTypeDirPath/manifest.name

      await this.writeJson(fileName, manifest);
    }
  }

  async copyEntityFiles(entityTypeDirPath: string, fileSet: {[index: string]: string[]}) {
    for (let entityClassName of Object.keys(fileSet)) {
      for (let fromFileName of fileSet[entityClassName]) {
        const toFileName = path.join(
          entityTypeDirPath,
          entityClassName,
          path.basename(fromFileName),
        );

        // TODO: создать папку - entityTypeDirPath/entityClassName

        await copyFile(fromFileName, toFileName);
      }
    }
  }

  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await writeFile(fileName, content);
  }

}
