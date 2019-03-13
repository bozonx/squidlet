import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';
import pathJoin from '../__old/SysFs';
import {Storage} from '../entities/drivers/Storage/Storage';
import systemConfig from './config/systemConfig';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class EnvSetLocalFs {
  private readonly system: System;

  private get storage(): Storage {
    return this.system.driversManager.getDriver('Storage');
  }


  constructor(system: System) {
    this.system = system;
  }


  /**
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.configs,
      configName
    );

    // TODO: add extension

    return this.storage.readJsonObjectFile(pathToFile);
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    await this.checkEntity(pluralType, entityName);

    const pathToFile = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.entities,
      pluralType,
      entityName,
      // TODO: review
      this.env.system.initCfg.fileNames.manifest
    );

    return this.storage.readJsonObjectFile(pathToFile) as any;
  }

  /**
   * Require for a main file as is without building.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    const manifest: ManifestBase = await this.loadEntityManifest(pluralType, entityName);
    const mainFileName: string = manifest.main;
    const filePath = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.entities,
      pluralType,
      entityName,
      mainFileName
    );
    const module = await this.storage.requireFile(filePath);

    return module.default;
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


  private async checkEntity(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName?: string
  ) {

    // TODO: запротить выход наверх, проверить существование entityName

  }

}
