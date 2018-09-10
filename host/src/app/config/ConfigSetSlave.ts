import * as path from 'path';

import ConfigSetManager from '../interfaces/ConfigSetManager';
import systemConfig from './systemConfig';
import FsDev from '../interfaces/dev/Fs.dev';
import System from '../System';


export default class ConfigSetSlave implements ConfigSetManager {
  private _system?: System;

  private get system(): System {
    return this._system as System;
  }

  constructor() {

  }

  init(system: System) {
    this._system = system;
  }

  // TODO: use one of config names
  async loadConfig<T>(configFileName: string): Promise<T> {

    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      this.initCfg.hostDirs.config,
      configFileName
    );

    return await this.loadJson(definitionsJsonFile);
  }

  async loadManifest<T>(typeDir: string, entityDir: string) : Promise<T> {

    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    const manifestPath = path.join(
      systemConfig.rootDirs.host,
      typeDir,
      entityDir,
      this.initCfg.fileNames.manifest
    );

    return await this.loadJson(manifestPath);
  }


  // const manifest = await this.system.loadManifest<DriverManifest>(
  //   this.system.initCfg.hostDirs.drivers,
  //   driverDefinition.className
  // );


  async loadEntityClass<T>(typeDir: string, entityDir: string) : Promise<T> {

    // TODO: rename to loadEntityMainFile
    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    const manifestPath = path.join(
      systemConfig.rootDirs.host,
      typeDir,
      entityDir,
      this.initCfg.fileNames.mainJs
    );

    return this.require(manifestPath).default;
  }

  /**
   * Load custom file of entity
   * @param entityType
   * @param entityName
   * @param fileName - relative file name
   */
  async loadEntityFile(entityType: string, entityName: string, fileName: string): Promise<string> {
    // TODO: load local entity file from flash
  }

  // it needs for test purpose
  private require(pathToFile: string) {

    // TODO: если на epspuino не будет рабоать с файлами из storage то загрузить файл и сделать eval

    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    return require(pathToFile);
  }

  private async loadJson(filePath: string): Promise<any> {

    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    // TODO: может будет работать через require на espurino?

    const fs: FsDev = this.driversManager.getDev<FsDev>('fs');
    const systemDriversListString = await fs.readFile(filePath);

    return JSON.stringify(systemDriversListString);
  }

}
