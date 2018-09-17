import System from '../System';
import Logger from '../interfaces/Logger';
import Events from '../Events';
import Host from '../Host';
import Messenger from '../../messenger/Messenger';
import Devices from '../Devices';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import DriverManifest from '../interfaces/DriverManifest';


/**
 * It is environment for devices and services
 */
export default class ServiceEnv implements Env {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;
  readonly system: System;

  constructor(system: System) {
    this.system = system;
    this.log = system.log;
    this.events = system.events;
    this.host = system.host;
    this.messenger = system.messenger;
    this.devices = system.devices;
  }

  getDev<T extends DriverInstance>(shortDevName: string): T {
    return this.system.driversManager.getDev<T>(shortDevName);
  }

  getDriver<T extends DriverInstance>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  // TODO: наверное лучше разделить env для services и devices
  // async loadManifest(driverName: string): Promise<DriverManifest> {
  //   return this.system.configSet.loadManifest('drivers', driverName);
  // }

}
