import * as _ from 'lodash';

import System from '../helpers/System';
import Host from './Host';
import Messenger from './Messenger';
import Devices from './Devices';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Router from './Router';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';

import HostConfig from './interfaces/HostConfig';


export default class App {
  readonly system: System;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;
  readonly devicesDispatcher: DevicesDispatcher;
  readonly drivers: Drivers;
  readonly router: Router;
  readonly log: Logger;
  // prepared config
  //readonly config: HostConfig;


  constructor(hostConfig: HostConfig) {
    this.system = new System();
    // config for current host
    this.host = new Host(this, hostConfig);
    this.log = defaultLogger;
    this.router = new Router(this);
    this.messenger = new Messenger(this);
    this.drivers = new Drivers(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
  }

  async init(): Promise<void> {
    await this.devices.init(this.host.config.devicesManifests, this.host.config.devicesConfigs);
    this.router.init();
    this.messenger.init();
    this.devicesDispatcher.init();
  }

}
