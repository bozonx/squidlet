import System from '../System';
import Logger from '../interfaces/Logger';
import Events from '../Events';
import Host from '../Host';
import Messenger from '../../messenger/Messenger';
import Devices from '../Devices';
import DriverInstance from '../interfaces/DriverInstance';
import Env from '../interfaces/Env';
import DriverManifest from '../interfaces/DriverManifest';
import DeviceManifest from '../interfaces/DeviceManifest';
import ServiceManifest from '../interfaces/ServiceManifest';


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

  async loadManifest(className: string): Promise<ServiceManifest> {

    // TODO: cache manifest for 1 minute

    return this.system.configSet.loadManifest<ServiceManifest>('services', className);
  }
}
