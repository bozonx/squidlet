import Context from './Context';
import ManifestBase from './interfaces/ManifestBase';
import {EntityType} from './interfaces/EntityTypes';
import {EntityClassType} from './managers/EntityManagerBase';
import {pathJoin} from './lib/paths';
import StorageIo from './interfaces/io/StorageIo';
import {splitFirstElement} from './lib/strings';
import {convertEntityTypeToPlural} from './lib/helpers';
import systemConfig from './systemConfig';
import mutateConfigDependOnAppType from './mutateConfigDependOnAppType';


/**
 * Base class for builds which use src files or which use requireJs to load modules.
 * It gives ability to load system configs and entity files.
 */
export default class EnvSet {
  private readonly context: Context;
  private get storageIo(): StorageIo {
    return this.context.system.ioManager.getIo('Storage') as any;
  }


  constructor(context: Context) {
    this.context = context;
  }

  async init() {
    // make base dirs if need
    if (!await this.storageIo.exists(systemConfig.rootDirs.envSet)) {
      await this.storageIo.mkdir(systemConfig.rootDirs.envSet);
    }

    if (!await this.storageIo.exists(systemConfig.rootDirs.varData)) {
      await this.storageIo.mkdir(systemConfig.rootDirs.varData);
    }

    if (!await this.storageIo.exists(systemConfig.rootDirs.tmp)) {
      await this.storageIo.mkdir(systemConfig.rootDirs.tmp);
    }
  }


  /**
   * Get builtin config.
   * In development mode it will be loaded from memory by devlopment ioSet.
   * @param configFileName - config name with ".json" extension
   */
  async loadConfig<T>(configFileName: string): Promise<T> {
    const pathToFile: string = pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.configs,
      configFileName
    );

    const loadedConfig = await this.readJsonObjectFile(pathToFile) as any;

    return mutateConfigDependOnAppType<T>(
      this.context.config?.appType,
      configFileName,
      loadedConfig
    ) as T;
  }

  /**
   * Get builtin manifest
   * In development mode it will be loaded from memory by development ioSet.
   * @param entityType - device, driver or service
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(entityType: EntityType, entityName: string) : Promise<T> {
    const pathToFile = pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.entities,
      convertEntityTypeToPlural(entityType),
      entityName,
      systemConfig.fileNames.manifest
    );

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Require for a main file as is without building.
   * @param entityType - device, driver or service
   * @param entityName - name of entity
   */
  async loadMain<T extends EntityClassType>(
    entityType: EntityType,
    entityName: string
  ): Promise<T> {
    const manifest: ManifestBase = await this.loadManifest(entityType, entityName);
    const mainFileName: string = splitFirstElement(manifest.main, '.')[0];
    const filePath: string = this.resolveEntityFilePath(entityType, entityName, mainFileName, manifest.srcDir);

    return (await this.context.system.ioManager.ioSet.requireLocalFile(filePath)).default;
  }

  /**
   * Load entity file as a string.
   * @param entityType - device, driver or service
   * @param entityName - name of entity
   * @param fileName - file path relative to entity dir
   */
  async loadEntityFile(
    entityType: EntityType,
    entityName: string,
    fileName: string
  ): Promise<string> {
    const manifest: ManifestBase = await this.loadManifest(entityType, entityName);
    const filePath: string = this.resolveEntityFilePath(entityType, entityName, fileName, manifest.srcDir);

    return this.storageIo.readFile(filePath);
  }

  /**
   * Load entity file as a binary.
   * @param entityType - device, driver or service
   * @param entityName - name of entity
   * @param fileName - file path relative to entity dir
   */
  async loadEntityBinFile(
    entityType: EntityType,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array> {
    const manifest: ManifestBase = await this.loadManifest(entityType, entityName);
    const filePath: string = this.resolveEntityFilePath(entityType, entityName, fileName, manifest.srcDir);

    return this.storageIo.readBinFile(filePath);
  }


  private resolveEntityFilePath(
    entityType: EntityType,
    entityName: string,
    fileName: string,
    entitySrcDir?: string
  ): string {
    // relative to entity src root (development mode)
    if (entitySrcDir) return pathJoin(entitySrcDir, fileName);

    // make absolute path
    return pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.entities,
      convertEntityTypeToPlural(entityType),
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
