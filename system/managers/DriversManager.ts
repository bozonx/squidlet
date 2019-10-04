import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DriverBase from '../base/DriverBase';
import systemConfig from '../systemConfig';


/**
 * Driver manager
 */
export default class DriversManager extends EntityManagerBase<DriverBase> {
  /**
   * Instantiate all the drivers
   */
  async instantiate() {
    // load list of drivers in order
    const orderedDriversList: string[] = await this.context.system.envSet.loadConfig<string[]>(
      systemConfig.fileNames.driversList
    );
    // load list of definitions of drivers
    const definitions = await this.context.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      systemConfig.fileNames.driversDefinitions
    );

    for (let driverName of orderedDriversList) {
      this.instances[driverName] = await this.makeInstance('driver', definitions[driverName]);
    }
  }

  /**
   * Call init() method of all the drivers
   */
  async initialize() {
    // TODO: use order
    // TODO: add initializeAll
    this.context.log.debug(`DriversManager: instantiating driver "${driverName}"`);
  }


  /**
   * Get driver instance.
   * It rises an error if driver hasn't found.
   */
  getDriver<T extends DriverBase>(driverName: string): T {
    const driver: DriverBase | undefined = this.instances[driverName];

    if (!driver) throw new Error(`Can't find the driver "${driverName}"`);

    return driver as T;
  }

}
