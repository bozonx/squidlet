import IO from '../helpers/IO';
import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './DevicesManager';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import HostConfig from './interfaces/HostConfig';


export default class System {
  readonly io: IO;
  readonly host: Host;
  readonly network: Network;
  readonly events: Events;
  readonly messenger: Messenger;
  readonly devicesManager: DevicesManager;
  readonly devicesDispatcher: DevicesDispatcher;
  readonly drivers: Drivers;
  readonly log: Logger;


  constructor(hostConfig: HostConfig) {
    this.io = new IO();
    // config for current host
    this.host = new Host(this, hostConfig);
    this.drivers = new Drivers();
    this.network = new Network(this.drivers, this.host.id, this.host.networkConfig);
    this.events = new Events();
    this.log = defaultLogger;
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
  }

  async initSystemDrivers(): Promise<void> {
    // TODO: add
  }

  async initNetwork(): Promise<void> {
    // TODO: add
  }

  async initMessenger(): Promise<void> {
    this.messenger.init();
  }

  /**
   * Init user layer - device representer, devices, device's drivers and services
   * @return {Promise<void>}
   */
  async initApp(): Promise<void> {
    // TODO: init initPlugins
    // TODO: init initDrivers - которые добавленны плагинами
    // TODO: init device's drivers
    // TODO: init device representer
    // TODO: init services
    // TODO: init devices


    await this.devicesManager.init(this.host.config.devicesManifests, this.host.config.devicesConfigs);

    this.devicesDispatcher.init();
  }

}
