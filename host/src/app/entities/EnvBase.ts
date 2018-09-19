import System from '../System';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import ManifestBase from '../interfaces/ManifestBase';


/**
 * It is environment for devices and services
 */
export default abstract class EnvBase implements Env {
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

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
