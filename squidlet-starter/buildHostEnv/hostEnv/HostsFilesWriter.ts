import * as path from 'path';

import DefinitionsSet from '../../../host/src/app/interfaces/DefinitionsSet';
import systemConfig from '../configs/systemConfig';
import {EntitiesNames} from '../entities/EntitiesSet';
import PreManifestBase from '../interfaces/PreManifestBase';
import HostConfig from '../../../host/src/app/interfaces/HostConfig';
import {ManifestsTypePluralName} from '../../../host/src/app/interfaces/ManifestTypes';
import MasterConfig from '../MasterConfig';
import Io from '../Io';
import HostClassNames from './HostClassNames';
import HostsFilesSet from './HostsFilesSet';


/**
 * Write all the hosts files to storage.
 * This files will be sent to a slave hosts.
 */
export default class HostsFilesWriter {
  private readonly io: Io;
  private readonly masterConfig: MasterConfig;
  private readonly hostClassNames: HostClassNames;
  private readonly hostsFilesSet: HostsFilesSet;

  // entities dir in storage
  private get entitiesDstDir(): string {
    return path.join(this.masterConfig.buildDir, systemConfig.entityBuildDir);
  }


  constructor(
    io: Io,
    masterConfig: MasterConfig,
    hostClassNames: HostClassNames,
    hostsFilesSet: HostsFilesSet
  ) {
    this.io = io;
    this.masterConfig = masterConfig;
    this.hostClassNames = hostClassNames;
    this.hostsFilesSet = hostsFilesSet;
  }

  /**
   * Copy files of hosts to storage
   * @param skipMaster - don't write master's files
   */
  async writeHostsConfigsFiles(skipMaster: boolean = false) {
    for (let hostId of this.masterConfig.getHostsIds()) {
      if (skipMaster && hostId === 'master') return;

      await this.proceedHost(hostId);
    }
  }

  private async buildMainFile(pluralType: ManifestsTypePluralName, preManifest: PreManifestBase) {
    const entityDstDir = path.join(this.entitiesDstDir, pluralType, preManifest.name);
    const mainJsFile = path.join(entityDstDir, systemConfig.hostInitCfg.fileNames.mainJs);

    const absoluteMainFileName = path.resolve(preManifest.baseDir, preManifest.main);

    // TODO: !!!!! билдить во временную папку
    // TODO: !!!!! написать в лог что билдится файл
    // TODO: !!!!! поддержка билда js файлов
    // TODO: !!!!! test

  }

  private async proceedHost(hostId: string) {
    const hostConfig: HostConfig = this.masterConfig.getFinalHostConfig(hostId);
    const definitionsSet: DefinitionsSet = this.hostsFilesSet.getDefinitionsSet(hostId);
    const hostsUsedEntitiesNames: EntitiesNames = this.hostClassNames.getEntitiesNames(hostId);
    const hostsDir = path.join(this.masterConfig.buildDir, systemConfig.pathToSaveHostsFileSet);
    const hostDir = path.join(hostsDir, hostId);
    const fileNames = systemConfig.hostInitCfg.fileNames;
    const configDir = path.join(hostDir, systemConfig.hostSysCfg.rootDirs.configs);

    // write host's config
    await this.writeJson(
      path.join(configDir, systemConfig.hostInitCfg.fileNames.hostConfig),
      hostConfig
    );

    // write host's definitions
    await this.writeJson(path.join(configDir, fileNames.systemDrivers), definitionsSet.systemDrivers);
    await this.writeJson(path.join(configDir, fileNames.regularDrivers), definitionsSet.regularDrivers);
    await this.writeJson(path.join(configDir, fileNames.systemServices), definitionsSet.systemServices);
    await this.writeJson(path.join(configDir, fileNames.regularServices), definitionsSet.regularServices);
    await this.writeJson(path.join(configDir, fileNames.devicesDefinitions), definitionsSet.devicesDefinitions);
    await this.writeJson(path.join(configDir, fileNames.driversDefinitions), definitionsSet.driversDefinitions);
    await this.writeJson(path.join(configDir, fileNames.servicesDefinitions), definitionsSet.servicesDefinitions);
    // write list of entities names
    await this.writeJson(path.join(hostDir, systemConfig.usedEntitiesNamesFile), hostsUsedEntitiesNames);

  }

  // TODO: may be move to IO
  private async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.io.mkdirP(path.dirname(fileName));
    await this.io.writeFile(fileName, content);
  }

}
