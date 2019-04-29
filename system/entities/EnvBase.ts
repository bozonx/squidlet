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
  readonly log: LogPublisher;
  readonly config: HostConfig;

  constructor(system: System) {
    this.system = system;
    this.log = system.log;
    this.config = system.host.config;
  }

  getIo<T extends IoItem>(shortDevName: string): T {
    //return this.system.driversManager.getDev<T>(shortDevName);
    return this.system.ioSet.getInstance<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
