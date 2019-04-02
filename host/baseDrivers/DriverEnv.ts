import DriverManifest from '../interfaces/DriverManifest';
import EnvBase from '../entities/EnvBase';


/**
 * It is singleton which is passed to all the drivers
 */
export default class DriverEnv  extends EnvBase {
  async loadManifest(driverName: string): Promise<DriverManifest> {
    return this.system.envSet.loadManifest<DriverManifest>('drivers', driverName);
  }

}
