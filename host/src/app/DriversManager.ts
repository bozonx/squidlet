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


type DriverFactoryClass = new (drivers: Drivers, driverConfig: {[index: string]: any}) => DriverFactory;


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
  getDriver(driverName: string): any {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: DriverInstance | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
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
    for (let driverName of driverNames) {
      await this.instantiateDriver(driverName);
    }

    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances.get(driverName);

      if (driver.init) await driver.init();
    }
  }

  private async instantiateDriver(driverName: string) {
    // TODO: get definition from config
    // TODO: put manifest to config
    // TODO: load manifest json
    // TODO: load main file

    // make instances of drivers
    for (let manifest of driverManifests) {
      const DriverClass = this.require(manifest.main).default;
      const instance: DriverInstance = new DriverClass(this, driversConfig[manifest.name]);

      this.instances = this.instances.set(manifest.name, instance);
    }

    const driversConfig: DriverDefinition[] = this.system.host.config.drivers;
    // initialize drivers
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const driver: DriverInstance = this.instances.get(name);

      await driver.init();
    }));

  }

  // it needs for test purpose
  private require(pathToFile: string) {
    return require(pathToFile);
  }

  private async loadJson(filePath: string): Promise<any> {
    const fs: FsDev = this.getDev<FsDev>('fs');

    const systemDriversListString = await fs.readFile(filePath);

    return JSON.stringify(systemDriversListString);
  }

}
