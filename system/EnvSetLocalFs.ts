import System from './System';
import ManifestBase from './interfaces/ManifestBase';
import {ManifestsTypePluralName} from './interfaces/ManifestTypes';
import {EntityClassType} from './entities/EntityManagerBase';
import systemConfig from './config/systemConfig';
import EnvSet from './interfaces/EnvSet';
import {pathJoin} from './helpers/nodeLike';
import StorageDev from './interfaces/dev/StorageDev';


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
    const pathToFile: string = pathJoin(systemConfig.envSetDirs.configs, configName);

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    const pathToFile = pathJoin(
      systemConfig.envSetDirs.entities,
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
      systemConfig.envSetDirs.entities,
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
    //await this.checkEntity(pluralType, entityName, fileName);

    const pathToFile: string = pathJoin(
      systemConfig.envSetDirs.entities,
      entityName,
      fileName
    );

    return this.readStringFile(pathToFile);
  }

  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    //await this.checkEntity(pluralType, entityName, fileName);

    const pathToFile: string = pathJoin(
      this.system.host.config.config.envSetDir,
      systemConfig.envSetDirs.entities,
      entityName,
      fileName
    );

    return this.devStorage.readBinFile(pathToFile);
  }

  //
  // getHostHashes(): Promise<{[index: string]: any}> {
  //   return this.readJsonObjectFile(systemConfig.hashFiles.host);
  // }
  //
  // getConfigsHashes(): Promise<{[index: string]: any}> {
  //   return this.readJsonObjectFile(systemConfig.hashFiles.configs);
  // }
  //
  // getEntitiesHashes(): Promise<{[index: string]: any}> {
  //   return this.readJsonObjectFile(systemConfig.hashFiles.entities);
  // }
  //
  // async writeHostFile(fileName: string, content: string): Promise<void> {
  //   // TODO: create dir, create or overwrite existing
  //   // TODO: запретить выход наверх
  // }
  //
  // async writeConfigFile(fileName: string, content: string): Promise<void> {
  //   // TODO: create dir, create or overwrite existing
  //   // TODO: запретить выход наверх
  // }
  //
  // async writeEntityFile(fileName: string, content: string): Promise<void> {
  //   // TODO: create dir, create or overwrite existing
  //   // TODO: запретить выход наверх
  // }
  //
  // writeHostHashesFile(content: string): Promise<void> {
  //   const pathToFile: string = pathJoin(
  //     this.system.host.config.config.envSetDir,
  //     systemConfig.hashFiles.host
  //   );
  //
  //   return this.devStorage.writeFile(pathToFile, content);
  // }
  //
  // writeConfigHashesFile(content: string): Promise<void> {
  //   const pathToFile: string = pathJoin(
  //     this.system.host.config.config.envSetDir,
  //     systemConfig.hashFiles.configs
  //   );
  //
  //   return this.devStorage.writeFile(systemConfig.hashFiles.configs, content);
  // }
  //
  // writeEntitiesHashesFile(content: string): Promise<void> {
  //   const pathToFile: string = pathJoin(
  //     this.system.host.config.config.envSetDir,
  //     systemConfig.hashFiles.entities
  //   );
  //
  //   return this.devStorage.writeFile(systemConfig.hashFiles.entities, content);
  // }

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
    const fileContent: string = await this.readStringFile(fileName);

    return JSON.parse(fileContent);
  }

  /**
   * Read string file relative to envSetDir
   */
  private async readStringFile(fileName: string): Promise<string> {
    const filePath = pathJoin(this.system.host.config.config.envSetDir, fileName);

    return this.devStorage.readFile(filePath);
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