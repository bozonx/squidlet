import System from '../System';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import ManifestBase from '../interfaces/ManifestBase';
import Logger from '../interfaces/Logger';


/**
 * It is environment for devices and services
 */
export default abstract class EnvBase implements Env {
  readonly system: System;
  readonly log: Logger;

  constructor(system: System) {
    this.system = system;
    this.log = system.log;
  }

  getDev<T extends DriverInstance>(shortDevName: string): T {
    return this.system.driversManager.getDev<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
