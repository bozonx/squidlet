import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DriverBase from '../base/DriverBase';


/**
 * Driver manager
 */
export default class DriversManager extends EntityManagerBase<DriverBase> {
  async initSystemDrivers(): Promise<void> {
    // get list of system drivers from json file
    const systemDriversList = await this.context.system.envSet.loadConfig<string[]>(
      this.context.system.initializationConfig.fileNames.systemDrivers
    );

    await this.initDrivers(systemDriversList);
  }

  async initRegularDrivers(): Promise<void> {
    // get list of regular drivers from json file
    const regularDriversList = await this.context.system.envSet.loadConfig<string[]>(
      this.context.system.initializationConfig.fileNames.regularDrivers
    );

    await this.initDrivers(regularDriversList);
  }

  /**
   * Get driver instance.
   * It rises an error if driver hasn't found.
   */
  getDriver<T extends DriverBase>(driverName: string): T {
    const driver: DriverBase | undefined = this.instances[driverName];

    if (!driver) {
      this.context.log.error(`DriversManager.getDriver: Can't find the driver "${driverName}"`);
      throw new Error(`Can't find the driver "${driverName}"`);
    }

    return driver as T;
  }

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
    return this.context.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.context.system.initializationConfig.fileNames.driversDefinitions
    );
  }

}
