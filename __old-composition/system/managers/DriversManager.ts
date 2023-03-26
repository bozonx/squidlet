import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import EntityManagerBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/EntityManagerBase.js';
import DriverBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';


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
