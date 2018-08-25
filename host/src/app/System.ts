import IO from '../helpers/IO';
import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './DevicesManager';
import Devices from './Devices';
import Drivers from './Drivers';
import Services from '../services';
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
  readonly devices: Devices;
  readonly drivers: Drivers;
  readonly services: Services;
  readonly log: Logger;


  constructor(hostConfig: HostConfig) {
    this.io = new IO();
    // config for current host
    this.host = new Host(this, hostConfig);
    this.drivers = new Drivers(this);
    this.services = new Services(this);
    this.network = new Network(this.drivers, this.host.id, this.host.networkConfig);
    this.events = new Events();
    this.log = defaultLogger;
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async initDrivers(): Promise<void> {
    await this.drivers.init(this.host.driversManifests, this.host.config.drivers);

    // TODO: потом поднять событие что драйверы инициализировались
  }

  async initServices(): Promise<void> {
    await this.services.init();

    // TODO: потом поднять событие что services инициализировались
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


    await this.devicesManager.init(this.host.devicesManifests, this.host.config.devices);

    this.devices.init();
  }

}
