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

import DriverBase from 'host/baseDrivers/DriverBase';
import systemConfig from 'host/config/systemConfig';
import pathJoin from 'host/helpers/nodeLike';
import {ManifestsTypePluralName} from 'host/interfaces/ManifestTypes';
import ManifestBase from 'host/interfaces/ManifestBase';
import {EntityClassType} from 'host/entities/EntityManagerBase';
import SysFsDriver from 'host/interfaces/SysFsDriver';
import {GetDriverDep} from 'host/entities/EntityBase';

import {Storage} from '../entities/drivers/Storage/Storage';


export default class SysFs implements SysFsDriver {
  private get storage(): Storage {
    return this.depsInstances.storage as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.storage = await getDriverDep('Storage');
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

  loadConfig(configName: string): Promise<{[index: string]: any}> {
    const pathToFile: string = pathJoin(
      this.env.config.config.envSetDir,
      systemConfig.rootDirs.configs,
      configName
    );

    return this.storage.readJsonObjectFile(pathToFile);
  }

  async loadEntityManifest(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<ManifestBase> {
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

  async loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType> {
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

  async loadEntityFile(
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

  async loadEntityBinFile(
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
