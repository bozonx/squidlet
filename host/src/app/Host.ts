import * as path from 'path';
const _defaultsDeep = require('lodash/defaultsDeep');
import * as uniqid from 'uniqid';

import FsDev from './interfaces/dev/Fs.dev';
import DeviceManifest from './interfaces/DeviceManifest';
import System from './System';
import HostConfig from './interfaces/HostConfig';
import HostNetworkConfig from '../network/interfaces/HostNetworkConfig';
import DriverManifest from './interfaces/DriverManifest';
import ServiceManifest from './interfaces/ServiceManifest';
import systemConfig from './config/systemConfig';


// TODO: ??? use immutable

export default class Host {
  private readonly system: System;
  private readonly hostConfig: HostConfig;
  private readonly hostNetworkConfig: HostNetworkConfig;

  // TODO: config - почему бы не брать общий конфиг в таком виде как передан в приложение ?

  get id(): string {

    // TODO: review
    // TODO: может использовать network.hostId

    //return this.hostConfig.address.host;

    // if (this.hostConfig.slave) return this.hostConfig.address.host;
    //
    return 'master';
  }

  // /**
  //  * Manifests by device class name
  //  */
  // get devicesManifests(): {[index: string]: DeviceManifest} {
  //   return this.hostConfig.devicesManifests;
  // }

  // /**
  //  * DevicesManager config by ids
  //  */
  // get devicesConfigs(): {[index: string]: DeviceConf} {
  //   return this.hostConfig.devicesConfigs;
  // }

  // get driversList(): Array<string> {
  //   return this.hostConfig.drivers;
  // }

  /**
   * Full host config
   */
  get config(): HostConfig {
    return this.hostConfig;
  }

  get networkConfig(): HostNetworkConfig {
    return this.hostNetworkConfig;
  }

  // parsed devices manifests by device's class name
  get devicesManifests(): {[index: string]: DeviceManifest} {

  }

  // TODO: почему тут список а в других местах объект?
  // parsed and sorted drivers manifests
  get driversManifests(): DriverManifest[] {

  }

  // parsed manifests of services
  get servicesManifests(): {[index: string]: ServiceManifest} {

  }

  constructor(system: System) {
    this.system = system;

    // TODO: прочитать разово с диска и удалить из памяти
    this.hostConfig = this.mergeConfigs(hostConfig);

    // TODO: откуда его взять

    this.hostNetworkConfig = {} as HostNetworkConfig;
  }

  generateUniqId(): string {
    // TODO: почему не используется из helpers ???
    return uniqid();
  }


  /**
   * load config from storage
   */
  async init(): Promise<void> {
    // TODO: !!! hostConfig: HostConfig
  }


  // getAddress(type: string, bus: string): string | undefined {
  //   const addrConfig = this.config.address;
  //
  //   if (!addrConfig) return;
  //
  //   // TODO: если несколько адресов - выбрать тот что с заданным type и bus
  //
  //   return addrConfig.address;
  // }

  // generateDestination(type: string, bus: string): Destination {
  //   return {
  //     host: this.id,
  //     type,
  //     bus,
  //     address: this.getAddress(type, bus),
  //   }
  // }


  private mergeConfigs(specifiedConfig: HostConfig): HostConfig {
    // TODO: не нужно

    // return {
    //   ...specifiedConfig,
    //   host: {
    //     ..._defaultsDeep({ ...specifiedConfig.host }, configHostPlatform, configHostDefault),
    //   }
    // }
  }






  async loadConfig<T>(configFileName: string): Promise<T> {

    // TODO: запрашивать сервис - он либо подгрузит из флеша либо отдаст вбилженный

    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      this.initCfg.hostDirs.config,
      configFileName
    );

    return await this.loadJson(definitionsJsonFile);
  }

  // TODO: перенести в Host.ts
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
