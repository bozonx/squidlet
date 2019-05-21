import System from '../System';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import ManifestBase from '../interfaces/ManifestBase';
import HostConfig from '../interfaces/HostConfig';
import IoItem from '../interfaces/IoItem';
import LogPublisher from '../LogPublisher';


/**
 * It is environment for devices and services
 */
export default abstract class EnvBase implements Env {
  readonly system: System;
  get log(): LogPublisher {
    return this.system.log;
  }
  get config(): HostConfig {
    return this.system.host.config;
  }

  constructor(system: System) {
    this.system = system;

  }

  getIo<T extends IoItem>(shortDevName: string): T {
    //return this.system.driversManager.getDev<T>(shortDevName);
    return this.system.ioManager.getIo<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
