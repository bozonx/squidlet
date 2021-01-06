import EntityDefinition from '../../../src/interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DriverBase from '../../../src/base/DriverBase';
import systemConfig from '../systemConfig';
import {EntityType} from '../../../src/interfaces/EntityTypes';


/**
 * Driver manager
 */
export default class DriversManager extends EntityManagerBase<DriverBase> {
  protected entityType: EntityType = 'driver';


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
      this.instances[driverName] = await this.makeInstance(definitions[driverName]);
    }
  }

  /**
   * Get driver instance.
   * It rises an error if driver hasn't found.
   */
  getDriver<T extends DriverBase>(driverName: string): T {
    if (!this.instances[driverName]) throw new Error(`Can't find the driver "${driverName}"`);

    return this.instances[driverName] as T;
  }

}
