import System from '../System';
import EntityDefinition from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';
import DriverEnv from '../baseDrivers/DriverEnv';
import EntityManagerBase from './EntityManagerBase';


/**
 * Driver manager
 */
export default class DriversManager extends EntityManagerBase<DriverInstance, DriverEnv> {
  constructor(system: System) {
    super(system, DriverEnv);
  }

  async initSystemDrivers(): Promise<void> {
    // get list of system drivers from json file
    const systemDriversList = await this.system.envSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemDrivers
    );

    await this.initDrivers(systemDriversList);
  }

  async initRegularDrivers(): Promise<void> {
    // get list of regular drivers from json file
    const regularDriversList = await this.system.envSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularDrivers
    );

    await this.initDrivers(regularDriversList);
  }

  // /**
  //  * Get dev by short name line 'fs', 'gpio' etc.
  //  * It rises an error if dev hasn't found.
  //  */
  // getDev<T>(shortDevName: string): T {
  //   const driverName = `${capitalize(shortDevName)}.dev`;
  //
  //   return this.getDriver<T>(driverName);
  // }

  /**
   * Get driver instance.
   * It rises an error if driver hasn't found.
   */
  getDriver<T extends DriverInstance>(driverName: string): T {
    const driver: DriverInstance | undefined = this.instances[driverName];

    if (!driver) {
      this.env.log.error(`DriversManager.getDriver: Can't find the driver "${driverName}"`);
      throw new Error(`Can't find the driver "${driverName}"`);
    }

    return driver as T;
  }

  // /**
  //  * Set platform specific devs
  //  * @param devs - like {DeviClassName: DevClass}
  //  */
  // async $registerDevs(devs: {[index: string]: EntityClassType}) {
  //   // TODO: ещё нет configSet
  //   // load list of definitions of drivers
  //   //const definitions: {[index: string]: EntityDefinition} = await this.loadDriversDefinitions();
  //
  //   for (let driverName of Object.keys(devs)) {
  //     const DriverClass: EntityClassType = devs[driverName];
  //
  //     // TODO: не надо подставлять ложный definition
  //
  //     //this.instances[driverName] = new DriverClass(definitions[driverName], this.env);
  //     this.instances[driverName] = new DriverClass({id: driverName, className: driverName, props: {}}, this.env);
  //   }
  //
  //   await this.initializeAll(Object.keys(devs));
  // }


  private async initDrivers(driverNames: string[]) {
    // load list of definitions of drivers
    const definitions = await this.loadDriversDefinitions();

    for (let driverName of driverNames) {
      this.instances[driverName] = await this.makeInstance('drivers', definitions[driverName]);
    }

    await this.initializeAll(driverNames);
  }

  /**
   * load list of definitions of drivers
   * requires config file driversDefinitions.json
   */
  private async loadDriversDefinitions(): Promise<{[index: string]: EntityDefinition}> {
    return this.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.driversDefinitions
    );
  }

}
