const _capitalize = require('lodash/capitalize');

import EntityDefinition, {EntityProps} from './interfaces/EntityDefinition';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverEnv from './DriverEnv';


type DriverClassType = new (props: EntityProps, env: DriverEnv) => DriverInstance;


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

    // TODO: нужно создать сущность и смержить props из манифеста dev и definition

    // TODO: манифест загрузить из хранилища системных манифестов или получить на вход это ф-и ?????

    // const manifest = await this.system.loadManifest<DriverManifest>(
    //   this.system.initCfg.hostDirs.drivers,
    //   driverDefinition.className
    // );

    // load list of definitions of drivers
    const definitions = await this.loadDriversDefinitions();

    for (let driverName of Object.keys(devs)) {
      const DriverClass: DriverClassType = devs[driverName];
      const driverProps: EntityProps = {
        ...definitions[driverName],
        // TODO: взять props из манифеста этого dev
      };
      const driverInstance: DriverInstance = new DriverClass(driverProps, this.driverEnv);

      this.instances[driverName] = driverInstance;
    }
  }


  private async initDrivers(driverNames: string[]) {
    // load list of definitions of drivers
    const definitions = await this.loadDriversDefinitions();

    for (let driverName of driverNames) {
      this.instances[driverName] = await this.instantiateDriver(definitions[driverName]);
    }

    await this.initializeAll(driverNames);
  }

  private async instantiateDriver(definition: EntityDefinition): Promise<DriverInstance> {
    const DriverClass: DriverClassType = await this.system.loadEntityClass<DriverClassType>(
      this.system.initCfg.hostDirs.drivers,
      definition.className
    );

    return new DriverClass(definition.props, this.driverEnv);
  }

  private async initializeAll(driverNames: string[]) {
    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances[driverName];

      if (driver.init) await driver.init();
    }
  }

  /**
   * load list of definitions of drivers
   */
  private async loadDriversDefinitions(): Promise<{[index: string]: EntityDefinition}> {
    return await this.system.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );
  }

}
