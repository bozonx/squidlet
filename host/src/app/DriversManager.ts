const _capitalize = require('lodash/capitalize');

import EntityDefinition from './interfaces/EntityDefinition';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverEnv from './DriverEnv';


type DriverClassType = new (props: EntityDefinition['props'], driverEnv: DriverEnv) => DriverInstance;


/**
 * Driver manager
 */
export default class DriversManager {
  readonly system: System;
  readonly driverEnv: DriverEnv;
  private instances: {[index: string]: DriverInstance} = {};

  constructor(system: System) {
    this.system = system;
    this.driverEnv = new DriverEnv(this.system);
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
    const driver: DriverInstance | undefined = this.instances[driverName];

    // TODO: эта ошибка в рантайме нужно залогировать ее но не вызывать исключение, либо делать try везде
    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    return driver as T;
  }

  async initSystemDrivers(): Promise<void> {
    // get list of system drivers from json file
    const systemDriversList = await this.system.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemDrivers
    );

    await this.initDrivers(systemDriversList);
  }

  async initRegularDrivers(): Promise<void> {
    // get list of regular drivers from json file
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

    // TODO: review

    const definitions = await this.system.loadConfig<{[index: string]: EntityDefinition}>(
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
      const driverInstance: DriverInstance = new DriverClass(this.driverEnv, driverProps);

      this.instances[driverName] = driverInstance;
    }
  }


  private async initDrivers(driverNames: string[]) {
    // load list of definitions of drivers
    const definitions = await this.system.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );

    for (let driverName of driverNames) {
      this.instances[driverName] = await this.instantiateDriver(definitions[driverName]);
    }

    await this.initializeAll(driverNames);
  }

  private async instantiateDriver(driverDefinition: EntityDefinition): Promise<DriverInstance> {
    // const manifest = await this.system.loadManifest<DriverManifest>(
    //   this.system.initCfg.hostDirs.drivers,
    //   driverDefinition.className
    // );
    const DriverClass = await this.system.loadEntityClass<DriverClassType>(
      this.system.initCfg.hostDirs.drivers,
      driverDefinition.className
    );
    // const props: DriverProps = {
    //   // TODO: driverDefinition тоже имеет props
    //   ...driverDefinition,
    // };

    return new DriverClass(driverDefinition.props, this.driverEnv);
  }

  private async initializeAll(driverNames: string[]) {
    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances[driverName];

      if (driver.init) await driver.init();
    }
  }

}
