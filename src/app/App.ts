import System from '../helpers/System';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import Devices from './Devices';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import HostConfig from './interfaces/HostConfig';


export default class App {
  readonly system: System;
  readonly host: Host;
  readonly events: Events;
  readonly messenger: Messenger;
  readonly devices: Devices;
  readonly devicesDispatcher: DevicesDispatcher;
  readonly drivers: Drivers;
  readonly log: Logger;


  constructor(hostConfig: HostConfig) {
    this.system = new System();
    // config for current host
    this.host = new Host(this, hostConfig);
    this.events = new Events();
    this.log = defaultLogger;
    this.messenger = new Messenger(this);
    this.drivers = new Drivers(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
  }

  async init(): Promise<void> {
    await this.devices.init(this.host.config.devicesManifests, this.host.config.devicesConfigs);
    this.messenger.init();
    this.devicesDispatcher.init();
  }

}
