const _capitalize = require('lodash/capitalize');

import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';
import DriverEnv from './DriverEnv';
import EntityManagerBase, {EntityClassType} from './EntityManagerBase';


/**
 * Driver manager
 */
export default class DriversManager extends EntityManagerBase<DriverInstance> {
  protected readonly EnvClass = DriverEnv;

  async initSystemDrivers(): Promise<void> {
    // get list of system drivers from json file
    const systemDriversList = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemDrivers
    );

    await this.initDrivers(systemDriversList);
  }

  async initRegularDrivers(): Promise<void> {
    // get list of regular drivers from json file
    const regularDriversList = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularDrivers
    );

    await this.initDrivers(regularDriversList);
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

  /**
   * Set platform specific devs
   * @param devs - like {DeviClassName: DevClass}
   */
  async $registerDevs(devs: {[index: string]: EntityClassType}) {
    // load list of definitions of drivers
    const definitions: {[index: string]: EntityDefinition} = await this.loadDriversDefinitions();

    for (let driverName of Object.keys(devs)) {
      const DriverClass: EntityClassType = devs[driverName];

      this.instances[driverName] = new DriverClass(definitions[driverName], this.env);
    }

    await this.initializeAll(Object.keys(devs));
  }


  private async initDrivers(driverNames: string[]) {
    // load list of definitions of drivers
    const definitions = await this.loadDriversDefinitions();

    for (let driverName of driverNames) {
      this.instances[driverName] = await this.makeInstance(definitions[driverName]);
    }

    await this.initializeAll(driverNames);
  }

  /**
   * load list of definitions of drivers
   */
  private async loadDriversDefinitions(): Promise<{[index: string]: EntityDefinition}> {
    return await this.system.configSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );
  }

}
