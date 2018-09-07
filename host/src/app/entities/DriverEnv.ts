import System from '../System';
import DriverManifest from '../interfaces/DriverManifest';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';


/**
 * It is singleton which is passed to all the drivers
 */
export default class DriverEnv implements Env {
  readonly system: System;

  constructor(system: System) {
    this.system = system;
  }


  getDev<T extends DriverInstance>(shortDevName: string): T {
    return this.system.driversManager.getDev<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  loadManifest(driverName: string): DriverManifest {

    // TODO: do it

    return { name: '' };
  }

}
