import * as path from 'path';

import Main from './Main';
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
    await this.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostFileSet.config
    );

    await this.writeJson(path.join(configDir, fileNames.systemDrivers), hostFileSet.systemDrivers);
    await this.writeJson(path.join(configDir, fileNames.regularDrivers), hostFileSet.regularDrivers);
    await this.writeJson(path.join(configDir, fileNames.systemServices), hostFileSet.systemServices);
    await this.writeJson(path.join(configDir, fileNames.regularServices), hostFileSet.regularServices);

    await this.writeJson(path.join(configDir, fileNames.devicesDefinitions), hostFileSet.devicesDefinitions);
    await this.writeJson(path.join(configDir, fileNames.driversDefinitions), hostFileSet.driversDefinitions);
    await this.writeJson(path.join(configDir, fileNames.servicesDefinitions), hostFileSet.servicesDefinitions);

    await this.writeJson(path.join(hostDir, systemConfig.entitiesFile), hostFileSet.entitiesFiles);

  }

  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.main.io.mkdirP(path.dirname(fileName));
    await this.main.io.writeFile(fileName, content);
  }

}
