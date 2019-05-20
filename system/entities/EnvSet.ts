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
   * Get builtin config
   * @param configName - config name with ".json" extension
   */
  loadConfig<T>(configName: string): Promise<T> {
    const pathToFile: string = pathJoin(
      this.system.systemConfig.envSetDirs.configs,
      configName
    );

    return this.readJsonObjectFile(pathToFile) as Promise<T>;
  }

  /**
   * Get builtin manifest
   * @param pluralType - devices, drivers or services
   * @param entityName - name of entity
   */
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T> {
    const pathToFile = pathJoin(
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
  async loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T> {
    const manifest: ManifestBase = await this.loadManifest(pluralType, entityName);
    const mainFileName: string = splitFirstElement(manifest.main, '.')[0];
    const filePath = pathJoin(
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.entities,
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
      this.system.systemConfig.envSetDirs.entities,
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
      this.system.systemConfig.rootDirs.envSet,
      this.system.systemConfig.envSetDirs.entities,
      entityName,
      fileName
    );

    return this.storageIo.readBinFile(pathToFile);
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
    const filePath = pathJoin(this.system.systemConfig.rootDirs.envSet, fileName);

    return this.storageIo.readFile(filePath);
  }

}
