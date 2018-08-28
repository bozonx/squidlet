import System from './System';
import Logger from './interfaces/Logger';
import Events from './Events';
import Host from './Host';
import Messenger from '../messenger/Messenger';
import Devices from './Devices';


/**
 * It is environment for devices and services
 */
export default class Env {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;
  private system: System;

  constructor(system: System) {
    this.system = system;
    this.log = system.log;
    this.events = system.events;
    this.host = system.host;
    this.messenger = system.messenger;
    this.devices = system.devices;
  }

  getDev<T>(shortDevName: string): T {
    return this.system.driversManager.getDev<T>(shortDevName);
  }

  getDriver<T>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

}
