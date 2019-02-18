/**
 * It uses the next file structure:
 *
 *     configs/
 *       config.json
 *       devicesDefinitions.json
 *       ... other configs
 *     entities/
 *       devices/
 *         deviceName/
 *           manifest.json
 *           main.js
 *           customFile.json
 *           ...other entity's files
 *       driver/
 *       services/
 *     host/
 *       app/
 *       ... other host's files
 *       index.js
 *     entities-hashes.json
 *     configs-hashes.json
 *     host-hashes.json
 */

import SysDev from './interfaces/dev/SysDev';
import pathJoin from './helpers/nodeLike';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';
import System from './System';
import systemConfig from './config/systemConfig';
import ManifestBase from './interfaces/ManifestBase';


export default class SysFs {
  private readonly system: System;
  private get sysDev(): SysDev {
    return this.system.devManager.getDev('Sys');
  }


  constructor(system: System) {
    this.system = system;
  }


  getHostHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(systemConfig.hashFiles.host);
  }

  getConfigsHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(systemConfig.hashFiles.configs);
  }

  getEntitiesHashes(): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(systemConfig.hashFiles.entities);
  }

  loadConfig(configName: string): Promise<{[index: string]: any}> {
    return this.sysDev.readJsonObjectFile(pathJoin(systemConfig.rootDirs.configs, configName));
  }

  async loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType> {
    const manifest: ManifestBase = await this.loadEntityManifest(pluralType, entityName);
    const mainFileName: string = manifest.main;
    const filePath = pathJoin(systemConfig.rootDirs.entities, pluralType, entityName, mainFileName);
    const module = await this.sysDev.requireFile(filePath);

    return module.default;
  }

  async loadEntityManifest(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<ManifestBase> {
    await this.checkEntity(pluralType, entityName);

    const pathToFile = pathJoin(systemConfig.rootDirs.entities, pluralType, entityName, this.system.initCfg.fileNames.manifest);

    return this.sysDev.readJsonObjectFile(pathToFile) as any;
  }

  async loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    await this.checkEntity(pluralType, entityName, fileName);

    return this.sysDev.readStringFile(pathJoin(systemConfig.rootDirs.entities, entityName, fileName));
  }

  async loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    await this.checkEntity(pluralType, entityName, fileName);

    return this.sysDev.readBinFile(pathJoin(systemConfig.rootDirs.entities, entityName, fileName));
  }

  async writeHostFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeConfigFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeEntityFile(fileName: string, content: string) {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  writeHostHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(systemConfig.hashFiles.host, content);
  }

  writeConfigHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(systemConfig.hashFiles.configs, content);
  }

  writeEntitiesHashesFile(content: string) {
    // TODO: запретить выход наверх

    return this.sysDev.writeFile(systemConfig.hashFiles.entities, content);
  }

  async removeHostFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }

  async removeEntitesFiles(filesList: string[]) {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }


  private async checkEntity(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName?: string
  ) {

    // TODO: запротить выход наверх, проверить существование entityName

  }

}
