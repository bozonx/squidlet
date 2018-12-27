import System from '../System';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import ManifestBase from '../interfaces/ManifestBase';
import Logger from '../interfaces/Logger';
import HostConfig from '../interfaces/HostConfig';
import Dev from '../interfaces/Dev';


/**
 * It is environment for devices and services
 */
export default abstract class EnvBase implements Env {
  readonly system: System;
  readonly log: Logger;
  readonly config: HostConfig;

  constructor(system: System) {
    this.system = system;
    this.log = system.log;
    this.config = system.host.config;
  }

  getDev<T extends Dev>(shortDevName: string): T {
    //return this.system.driversManager.getDev<T>(shortDevName);
    return this.system.devManager.getDev<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
