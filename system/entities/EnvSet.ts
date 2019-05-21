import System from '../System';
import ManifestBase from '../interfaces/ManifestBase';
import {ManifestsTypePluralName} from '../interfaces/ManifestTypes';
import {EntityClassType} from './EntityManagerBase';
import {pathIsAbsolute, pathJoin} from '../helpers/nodeLike';
import StorageIo from '../interfaces/io/StorageIo';
import {splitFirstElement} from '../helpers/strings';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 */
export default class EnvSet {
  private readonly system: System;
  private get storageIo(): StorageIo {
    return this.system.ioManager.getIo('Storage') as any;
  }


  constructor(system: System) {
    this.system = system;
  }


  /**
   * Get builtin config.
   * In development mode it will be loaded from memory by devlopment ioSet.
   * @param configFileName - config name with ".json" extension
   */
  loadConfig<T>(configFileName: string): Promise<T> {
    const pathToFile: string = pathJoin(
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.configs,
      configFileName
    );

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * In development mode it will be loaded from memory by devlopment ioSet.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    const pathToFile = pathJoin(
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.entities,
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
  async loadMain<T extends EntityClassType>(
    pluralType: ManifestsTypePluralName,
    entityName: string
  ): Promise<T> {
    const manifest: ManifestBase = await this.loadManifest(pluralType, entityName);
    const mainFileName: string = splitFirstElement(manifest.main, '.')[0];
    // by default use a absolute path (in development mode)
    let filePath: string = manifest.main;

    if (!pathIsAbsolute(manifest.main)) {
      filePath = pathJoin(
        this.system.systemConfig.rootDirs.envSet,
        this.system.systemConfig.envSetDirs.entities,
        pluralType,
        entityName,
        mainFileName
      );
    }

    return require(filePath).default;
  }

  /**
   * Load entity file as a string.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   * @param fileName - relative file path
   */
  async loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {

    // TODO: а разве путь будет абсолютный ???? - наверное надо брать из манифеста

    // by default use a absolute path (in development mode)
    let filePath: string = fileName;

    if (!pathIsAbsolute(fileName)) {
      filePath = pathJoin(
        this.system.systemConfig.rootDirs.envSet,
        this.system.systemConfig.envSetDirs.entities,
        pluralType,
        entityName,
        fileName
      );
    }

    return this.storageIo.readFile(filePath);
  }

  /**
   * Load entity file as a binary.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   * @param fileName - relative file path
   */
  async loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    // by default use a absolute path (in development mode)
    let filePath: string = fileName;

    if (!pathIsAbsolute(fileName)) {
      filePath = pathJoin(
        this.system.systemConfig.rootDirs.envSet,
        this.system.systemConfig.envSetDirs.entities,
        pluralType,
        entityName,
        fileName
      );
    }

    return this.storageIo.readBinFile(filePath);
  }


  /**
   * Read json object file
   */
  private async readJsonObjectFile(filePath: string): Promise<{[index: string]: any}> {
    const fileContent: string = await this.storageIo.readFile(filePath);

    return JSON.parse(fileContent);
  }

}
