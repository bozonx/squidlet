import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';
import {Storage} from '../entities/drivers/Storage/Storage';
import systemConfig from './config/systemConfig';
import EnvSet from './interfaces/EnvSet';
import pathJoin from './helpers/nodeLike';
import StorageDev from '../nodejs/devs/Storage';
import * as path from "path";
import {callPromised} from '../nodejs/helpers';
import * as fs from "fs";


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class EnvSetLocalFs implements EnvSet {
  private readonly system: System;
  private get devStorage(): StorageDev {
    return this.system.devManager.getDev('Storage');
  }
  // private get storage(): Storage {
  //   return this.system.driversManager.getDriver('Storage');
  // }


  constructor(system: System) {
    this.system = system;
  }


  /**
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    const pathToFile: string = pathJoin(systemConfig.rootDirs.configs, configName);

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    const pathToFile = pathJoin(
      systemConfig.rootDirs.entities,
      pluralType,
      entityName,
      this.system.initCfg.fileNames.manifest
    );

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    const manifest: ManifestBase = await this.loadManifest(pluralType, entityName);
    const mainFileName: string = manifest.main;
    const filePath = pathJoin(
      this.system.host.config.config.envSetDir,
      systemConfig.rootDirs.entities,
      pluralType,
      entityName,
      mainFileName
    );

    return require(filePath).default;
  }

  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    await this.checkEntity(pluralType, entityName, fileName);

    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.entities,
      entityName,
      fileName
    );

    return this.storage.readStringFile(pathToFile);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    await this.checkEntity(pluralType, entityName, fileName);

    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.entities,
      entityName,
      fileName
    );

    return this.storage.readBinFile(pathToFile);
  }


  getHostHashes(): Promise<{[index: string]: any}> {
    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.hashFiles.host
    );

    return this.storage.readJsonObjectFile(pathToFile);
  }

  getConfigsHashes(): Promise<{[index: string]: any}> {
    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.hashFiles.configs
    );

    return this.storage.readJsonObjectFile(pathToFile);
  }

  getEntitiesHashes(): Promise<{[index: string]: any}> {
    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.hashFiles.entities
    );

    return this.storage.readJsonObjectFile(pathToFile);
  }

  async writeHostFile(fileName: string, content: string): Promise<void> {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeConfigFile(fileName: string, content: string): Promise<void> {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  async writeEntityFile(fileName: string, content: string): Promise<void> {
    // TODO: create dir, create or overwrite existing
    // TODO: запретить выход наверх
  }

  writeHostHashesFile(content: string): Promise<void> {
    // TODO: запретить выход наверх

    return this.storage.writeFile(systemConfig.hashFiles.host, content);
  }

  writeConfigHashesFile(content: string): Promise<void> {
    // TODO: запретить выход наверх

    return this.storage.writeFile(systemConfig.hashFiles.configs, content);
  }

  writeEntitiesHashesFile(content: string): Promise<void> {
    // TODO: запретить выход наверх

    return this.storage.writeFile(systemConfig.hashFiles.entities, content);
  }

  async removeHostFiles(filesList: string[]): Promise<void> {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }

  async removeEntitiesFiles(filesList: string[]): Promise<void> {
    // TODO: remove these files. They are unused files
    // TODO:  And remove dir if no one file exist
    // TODO: support of removing whole dirs
    // TODO: запретить выход наверх
  }


  /**
   * Read json object file relative to envSetDir
   */
  private async readJsonObjectFile(fileName: string): Promise<{[index: string]: any}> {
    const filePath = path.join(this.system.host.config.config.envSetDir, fileName);
    const fileContent: string = await this.devStorage.readFile(filePath);

    return JSON.parse(fileContent);
  }
  //
  // private async checkEntity(
  //   pluralType: ManifestsTypePluralName,
  //   entityName: string,
  //   fileName?: string
  // ) {
  //
  //   // TODO: запротить выход наверх, проверить существование entityName
  //
  // }

}
