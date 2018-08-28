const _capitalize = require('lodash/capitalize');
import * as path from 'path';

import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverDefinition from './interfaces/DriverDefinition';
import FsDev from './interfaces/dev/Fs.dev';
import Drivers from './Drivers';
import systemConfig from './systemConfig';
import DriverProps from './interfaces/DriverProps';


type DriverClassType = new (drivers: Drivers, driverProps: DriverProps) => DriverInstance;


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

  /**
   * Get dev by short name line 'fs', 'gpio' etc
   */
  getDev<T>(shortDevName: string): T {
    const driverName = `${_capitalize(shortDevName)}.dev`;

    // TODO: использовать try ???

    return this.getDriver<T>(driverName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    const driver: DriverInstance | undefined = this.instances.get(driverName);

    // TODO: эта ошибка в рантайме нужно залогировать ее но не вызывать исключение, либо делать try везде
    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    return this.instances.get(driverName) as T;
  }


  async $initSystemDrivers(): Promise<void> {
    const systemDriversJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.systemDrivers
    );
    const systemDriversList: string[] = await this.system.loadJson(systemDriversJsonFile);

    await this.initDrivers(systemDriversList);
  }

  async $initRegularDrivers(): Promise<void> {
    const regularDriversJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.regularDrivers
    );
    const regularDriversList: string[] = await this.system.loadJson(regularDriversJsonFile);

    await this.initDrivers(regularDriversList);
  }

  /**
   * Set platform specific devs
   * @param devs - like {DeviClassName: DevClass}
   */
  async $setDevs(devs: {[index: string]: DriverClassType}) {
    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.driversDefinitions
    );
    const definitions: {[index: string]: DriverDefinition} = await this.system.loadJson(definitionsJsonFile);

    for (let driverName of Object.keys(devs)) {
      const DriverClass: DriverClassType = devs[driverName];
      const driverProps: DriverProps = {
        ...definitions[driverName],
        manifest: {
          name: driverName,
          type: 'dev',
        },
      };
      const driverInstance: DriverInstance = new DriverClass(this.drivers, driverProps);

      this.instances = this.instances.set(driverName, driverInstance);
    }
  }


  private async initDrivers(driverNames: string[]) {
    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.driversDefinitions
    );
    const definitions: {[index: string]: DriverDefinition} = await this.system.loadJson(definitionsJsonFile);

    for (let driverName of driverNames) {
      const driverInstance: DriverInstance = await this.instantiateDriver(driverName, definitions[driverName]);

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
    const manifest: DriverManifest = await this.system.loadJson(manifestPath);
    // TODO: !!!! переделать - наверное просто загружать main.js
    const mainFilePath = path.resolve(driverDir, manifest.main);
    const DriverClass: DriverClassType = this.system.require(mainFilePath).default;
    const props: DriverProps = {
      // TODO: driverDefinition тоже имеет props
      ...driverDefinition,
      manifest,
    };

    return new DriverClass(this.drivers, props);
  }

}
