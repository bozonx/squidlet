import * as path from 'path';

import Main from './Main';
import HostFilesSet from './interfaces/HostFilesSet';
import systemConfig from './configs/systemConfig';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class HostsFilesWriter {
  private readonly main: Main;
  private readonly baseDir: string;

  constructor(main: Main) {
    this.main = main;
    this.baseDir = path.join(this.main.masterConfig.buildDir, systemConfig.pathToSaveHostsFileSet);
  }

  /**
   * Copy files for hosts to storage to store of master
   */
  async writeToStorage() {
    await this.writeEntitiesFiles();
    await this.writeHostsFiles();
  }


  private async writeEntitiesFiles() {
    // TODO: write manifests
    // TODO: write main files
    // TODO: write entities files
  }

  private async writeHostsFiles() {

    // TODO: мастер можно пропустить если указанно

    for (let hostId of this.main.hostsConfigSet.getHostsIds()) {
      const filesSet: HostFilesSet = {
        config: this.main.hostsConfigSet.getHostConfig(hostId),
        ...this.main.hostsFilesSet.getDefinitionsSet(hostId),
        ...this.main.hostsFilesSet.getDestEntitiesSet(hostId),
      };

      await this.proceedHost(hostId, filesSet);
    }
  }

  private async proceedHost(hostId: string, hostFileSet: HostFilesSet) {
    const hostDir = path.join(this.baseDir, hostId);
    const hostDirs = systemConfig.hostInitCfg.hostDirs;
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(hostDir, hostDirs.config);

    // write host's config
    await this.main.$writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostFileSet.config
    );

    // write host's definitions
    await this.main.$writeJson(path.join(configDir, fileNames.systemDrivers), hostFileSet.systemDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.regularDrivers), hostFileSet.regularDrivers);
    await this.main.$writeJson(path.join(configDir, fileNames.systemServices), hostFileSet.systemServices);
    await this.main.$writeJson(path.join(configDir, fileNames.regularServices), hostFileSet.regularServices);
    await this.main.$writeJson(path.join(configDir, fileNames.devicesDefinitions), hostFileSet.devicesDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.driversDefinitions), hostFileSet.driversDefinitions);
    await this.main.$writeJson(path.join(configDir, fileNames.servicesDefinitions), hostFileSet.servicesDefinitions);

    // TODO: !!! ????
    //await this.main.$writeJson(path.join(hostDir, systemConfig.entitiesFile), hostFileSet.entitiesFiles);
  }

}
