import Context from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import EntityManifest from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityManifest.js';
import {EntityType} from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {EntityClassType} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/EntityManagerBase.js';
import {pathJoin} from '../../../squidlet-lib/src/paths';
import StorageIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import {splitFirstElement} from '../../../squidlet-lib/src/strings';
import {convertEntityTypeToPlural} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import systemConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';
import mutateConfigDependOnAppType from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/mutateConfigDependOnAppType.js';


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

    const varDir = pathJoin(systemConfig.rootDirs.varData, systemConfig.storageDirs.var);

    if (!await this.storageIo.exists(varDir)) {
      await this.storageIo.mkdir(varDir);
    }

    const cacheDir = pathJoin(systemConfig.rootDirs.varData, systemConfig.storageDirs.cache);

    if (!await this.storageIo.exists(cacheDir)) {
      await this.storageIo.mkdir(cacheDir);
    }

    const logsDir = pathJoin(systemConfig.rootDirs.varData, systemConfig.storageDirs.logs);

    if (!await this.storageIo.exists(logsDir)) {
      await this.storageIo.mkdir(logsDir);
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
  loadManifest<T extends EntityManifest>(entityType: EntityType, entityName: string) : Promise<T> {
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
    const manifest: EntityManifest = await this.loadManifest(entityType, entityName);
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
    const manifest: EntityManifest = await this.loadManifest(entityType, entityName);
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
    const manifest: EntityManifest = await this.loadManifest(entityType, entityName);
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
