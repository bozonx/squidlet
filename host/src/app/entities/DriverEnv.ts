import System from '../System';
import DriverManifest from '../interfaces/DriverManifest';


/**
 * It is singleton which is passed to all the drivers
 */
export default class DriverEnv {
  readonly system: System;

  constructor(system: System) {
    this.system = system;
  }


  getDev<T>(shortDevName: string): T {
    return this.system.driversManager.getDev<T>(shortDevName);
  }

  getDriver<T>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  loadManifest(driverName: string): DriverManifest {

    // TODO: do it

    return { name: '' };
  }

}
