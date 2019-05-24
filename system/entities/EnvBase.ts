import System from '../System';
import ManifestBase from '../interfaces/ManifestBase';
import HostConfig from '../interfaces/HostConfig';
import IoItem from '../interfaces/IoItem';
import LogPublisher from '../LogPublisher';
import DriverBase from '../baseDrivers/DriverBase';
import {Api} from '../Api';
import CategorizedEvents from '../helpers/CategorizedEvents';


/**
 * It is environment for devices and services
 */
export default abstract class EnvBase {
  readonly system: System;
  get api(): Api {
    return this.system.api;
  }
  get events(): CategorizedEvents {
    return this.system.events;
  }
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

  getDriver<T extends DriverBase>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  abstract async loadManifest(className: string): Promise<ManifestBase>;

}
