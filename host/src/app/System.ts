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
  readonly host: Host;
  readonly network: Network;
  readonly events: Events;
  readonly messenger: Messenger;
  readonly devicesManager: DevicesManager;
  readonly devices: Devices;
  readonly drivers: Drivers;
  readonly services: Services;
  readonly log: Logger;


  constructor() {

    // TODO: загрузить конфиг - hostConfig: HostConfig

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

  async start() {
    await this.loadConfig();
    await this.initSystemDrivers();
    await this.initNetwork();
    await this.initMessenger();
    await this.initSystemServices();
    await this.initApp();
  }


  /**
   * load config from storage
   */
  async loadConfig(): Promise<void> {
    // TODO: !!!
  }

  async initSystemDrivers(): Promise<void> {
    await this.drivers.init(this.host.driversManifests, this.host.config.drivers);

    // TODO: только системные драйверы и dev
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

  async initSystemServices(): Promise<void> {
    // TODO: init master network configurator
    // TODO: init master updater
    // TODO: init master configurator
    // TODO: после конфигурирования - перезагружаться
  }

  /**
   * Init user layer - device representer, devices, device's drivers and services
   * @return {Promise<void>}
   */
  async initApp(): Promise<void> {
    // TODO: init other drivers
    // TODO: init services
    // TODO: init devices

    await this.devicesManager.init(this.host.devicesManifests, this.host.config.devices);

    this.devices.init();
  }

}
