import System from '../System';
import ManifestBase from '../interfaces/ManifestBase';
import {ManifestsTypePluralName} from '../interfaces/ManifestTypes';
import {EntityClassType} from './EntityManagerBase';
import {pathJoin} from '../helpers/nodeLike';
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
    const filePath: string = await this.resolveFilePath(pluralType, entityName, mainFileName, manifest.srcDir);

    return require(filePath).default;
  }

  /**
   * Load entity file as a string.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   * @param fileName - file path relative to entity dir
   */
  async loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string> {
    const manifest: ManifestBase = await this.loadManifest(pluralType, entityName);
    const filePath: string = await this.resolveFilePath(pluralType, entityName, fileName, manifest.srcDir);

    return this.storageIo.readFile(filePath);
  }

  /**
   * Load entity file as a binary.
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   * @param fileName - file path relative to entity dir
   */
  async loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    const manifest: ManifestBase = await this.loadManifest(pluralType, entityName);
    const filePath: string = await this.resolveFilePath(pluralType, entityName, fileName, manifest.srcDir);

    return this.storageIo.readBinFile(filePath);
  }


  private async resolveFilePath(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string,
    entitySrcDir?: string
  ): Promise<string> {
    // relative to entity src root (development mode)
    if (entitySrcDir) return pathJoin(entitySrcDir, fileName);

    // make absolute path
    return pathJoin(
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.entities,
      pluralType,
      entityName,
      fileName
    );
  }

  /**
   * Read json object file
   */
  private async readJsonObjectFile(filePath: string): Promise<{[index: string]: any}> {
    const fileContent: string = await this.storageIo.readFile(filePath);

    return JSON.parse(fileContent);
  }

}
