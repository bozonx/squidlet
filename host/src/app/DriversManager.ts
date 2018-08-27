import * as path from 'path';

import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverFactory from './interfaces/DriverFactory';
import DriverDefinition from './interfaces/DriverDefinition';
import FsDev from './interfaces/dev/Fs.dev';
import Drivers from './Drivers';
import systemConfig from './systemConfig';
import DriverProps from './interfaces/DriverProps';


type DriverFactoryClass = new (drivers: Drivers, driverProps: DriverProps) => DriverFactory;


/**
 * Drivers manager
 */
export default class DriversManager {
  readonly system: System;
  readonly drivers: Drivers;
  private instances: Map<string, DriverInstance> = Map<string, DriverInstance>();

  constructor(system: System) {
    this.system = system;
    this.drivers = new Drivers(this.system);
  }

  getDev<T>(shortDevName: string): T {
    // TODO: !!!
  }

  // TODO: наверное возвращать Drivers?
  getDriver<T extends DriverInstance>(driverName: string): T {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: DriverInstance | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    return this.instances.get(driverName) as T;
  }


  async $initSystemDrivers(): Promise<void> {
    const systemDriversJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.systemDrivers
    );
    const systemDriversList: string[] = await this.loadJson(systemDriversJsonFile);

    await this.initDrivers(systemDriversList);
  }

  async $initRegularDrivers(): Promise<void> {
    const regularDriversJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.regularDrivers
    );
    const regularDriversList: string[] = await this.loadJson(regularDriversJsonFile);

    await this.initDrivers(regularDriversList);
  }

  /**
   * Set platform specific devs
   * @param devs - like {DeviClassName: DevClass}
   */
  $setDevs(devs: {[index: string]: DriverFactoryClass}) {
    // TODO: указать тип - new () => any  \ DriverFactory
  }


  private async initDrivers(driverNames: string[]) {
    const driverDefinitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.regularDrivers
    );
    const driverDefinitions: {[index: string]: DriverDefinition} = await this.loadJson(driverDefinitionsJsonFile);

    for (let driverName of driverNames) {
      const driverInstance: DriverInstance = await this.instantiateDriver(driverName, driverDefinitions[driverName]);

      this.instances = this.instances.set(driverName, driverInstance);
    }

    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances.get(driverName);

      if (driver.init) await driver.init();
    }
  }

  private async instantiateDriver(driverName: string, driverDefinition: DriverDefinition): Promise<DriverInstance> {
    const driverDir = path.join(systemConfig.rootDirs.host, systemConfig.hostDirs.drivers, driverName);
    const manifestPath = path.join(driverDir, systemConfig.fileNames.manifest);
    const manifest: DriverManifest = await this.loadJson(manifestPath);
    // TODO: переделать - наверное просто загружать main.js
    const mainFilePath = path.resolve(driverDir, manifest.main);
    const DriverClass = this.require(mainFilePath).default;
    const driverProps: DriverProps = {
      ...driverDefinition,
      manifest: manifest,
    };

    return new DriverClass(this.drivers, driverProps);
  }

  // it needs for test purpose
  private require(pathToFile: string) {

    // TODO: если на epspuino не будет рабоать с файлами из storage то загрузить файл и сделать eval

    return require(pathToFile);
  }

  private async loadJson(filePath: string): Promise<any> {

    // TODO: может будет работать через require на espurino?

    const fs: FsDev = this.getDev<FsDev>('fs');

    const systemDriversListString = await fs.readFile(filePath);

    return JSON.stringify(systemDriversListString);
  }

}
