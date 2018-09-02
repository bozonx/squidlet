import * as path from 'path';

import Main from './Main';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import ManifestBase from '../host/src/app/interfaces/ManifestBase';
import HostFilesSet from './interfaces/HostFilesSet';
import systemConfig from './configs/systemConfig';


export default class HostsFilesWriter {
  private readonly main: Main;
  private readonly baseDir: string;

  constructor(main: Main) {
    this.main = main;
    this.baseDir = path.join(this.main.buildDir, systemConfig.pathToSaveHostsFileSet);
  }

  /**
   * Copy files for hosts to storage to store of master
   */
  async writeToStorage() {
    const filesCollection: {[index: string]: HostFilesSet} = this.main.hostsFilesSet.getCollection();

    for (let hostId of Object.keys(filesCollection)) {
      await this.proceedHost(hostId, filesCollection[hostId]);
    }
  }


  private async proceedHost(hostId: string, hostFileSet: HostFilesSet) {
    const hostDir = path.join(this.baseDir, hostId);
    const hostDirs = systemConfig.hostInitCfg.hostDirs;
    const fileNames = systemConfig.hostInitCfg.fileNames;

    const configDir = path.join(hostDir, hostDirs.config);
    // const devicesPath = path.join(hostDir, hostDirs.devices);
    // const driversPath = path.join(hostDir, hostDirs.drivers);
    // const servicesPath = path.join(hostDir, hostDirs.services);

    await this.writeHostConfig(configDir, hostFileSet.config);

    // TODO: нет смысла копировать манифесты и entityFiles - их просто брать из папки манифестов

    // await this.writeManifests<DeviceManifest>(devicesPath, hostFileSet.devicesManifests);
    // await this.writeManifests<DriverManifest>(driversPath, hostFileSet.driversManifests);
    // await this.writeManifests<ServiceManifest>(servicesPath, hostFileSet.servicesManifests);
    //
    // await this.copyEntityFiles(devicesPath, hostFileSet.devicesFiles);
    // await this.copyEntityFiles(driversPath, hostFileSet.driversFiles);
    // await this.copyEntityFiles(servicesPath, hostFileSet.servicesFiles);

    await this.writeJson(path.join(configDir, systemConfig.entitiesFile), hostFileSet.entitiesFiles);

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

    await this.writeJson(fileName, hostConfig);
  }

  async writeManifests<T extends ManifestBase>(entityTypeDirPath: string, manifests: T[]) {
    for (let manifest of manifests) {
      const fileName = path.join(
        entityTypeDirPath,
        manifest.name,
        systemConfig.hostInitCfg.fileNames.manifest
      );

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

        await this.main.io.mkdirP(path.dirname(toFileName));

        await this.main.io.copyFile(fromFileName, toFileName);
      }
    }
  }

  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.main.io.mkdirP(path.dirname(fileName));
    await this.main.io.writeFile(fileName, content);
  }

}
