import DeviceManifest from './interfaces/DeviceManifest';

const _capitalize = require('lodash/capitalize');
import * as path from 'path';

import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverDefinition from './interfaces/DriverDefinition';
import DriverEnv from './DriverEnv';
import DriverProps from './interfaces/DriverProps';
import systemConfig from './systemConfig';


type DriverClassType = new (drivers: DriverEnv, props: DriverProps) => DriverInstance;


/**
 * Driver manager
 */
export default class DriversManager {
  readonly system: System;
  // TODO: reveiw
  readonly drivers: DriverEnv;
  // TODO: зачем тут immutable?
  private instances: Map<string, DriverInstance> = Map<string, DriverInstance>();

  constructor(system: System) {
    this.system = system;
    this.drivers = new DriverEnv(this.system);
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

    return driver as T;
  }


  async initSystemDrivers(): Promise<void> {
    const systemDriversList = await this.system.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemDrivers
    );

    await this.initDrivers(systemDriversList);
  }

  async initRegularDrivers(): Promise<void> {
    const regularDriversList = await this.system.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularDrivers
    );

    await this.initDrivers(regularDriversList);
  }

  /**
   * Set platform specific devs
   * @param devs - like {DeviClassName: DevClass}
   */
  async $setDevs(devs: {[index: string]: DriverClassType}) {
    const definitions = await this.system.loadConfig<{[index: string]: DriverDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );

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
    const definitions = await this.system.loadConfig<{[index: string]: DriverDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );

    for (let driverName of driverNames) {
      const driverInstance: DriverInstance = await this.instantiateDriver(definitions[driverName]);

      this.instances = this.instances.set(driverName, driverInstance);
    }

    await this.initializeAll(driverNames);
  }

  private async initializeAll(driverNames: string[]) {
    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances.get(driverName);

      if (driver.init) await driver.init();
    }
  }

  private async instantiateDriver(driverDefinition: DriverDefinition): Promise<DriverInstance> {
    const manifest = await this.system.loadManifest<DriverManifest>(
      this.system.initCfg.hostDirs.drivers,
      driverDefinition.className
    );
    const DriverClass = await this.system.loadEntityClass<DriverClassType>(
      this.system.initCfg.hostDirs.drivers,
      driverDefinition.className
    );
    const props: DriverProps = {
      // TODO: driverDefinition тоже имеет props
      ...driverDefinition,
      manifest,
    };

    return new DriverClass(this.drivers, props);
  }

}
