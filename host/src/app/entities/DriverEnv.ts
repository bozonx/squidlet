import System from '../System';
import DriverManifest from '../interfaces/DriverManifest';
import DriverInstance from '../interfaces/DriverInstance';
import EnvBase from './EnvBase';


/**
 * It is singleton which is passed to all the drivers
 */
export default class DriverEnv  extends EnvBase {
  constructor(system: System) {
    super(system);
  }

  async loadManifest(driverName: string): Promise<DriverManifest> {

    // TODO: cache manifest for 1 minute

    return this.system.configSet.loadManifest<DriverManifest>('drivers', driverName);
  }

}
