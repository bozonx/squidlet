import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './DevicesManager';
import Devices from './Devices';
import Drivers from './Drivers';
import Services from './Services';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';


export default class System {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly drivers: Drivers;
  readonly network: Network;
  readonly services: Services;
  readonly messenger: Messenger;
  readonly devicesManager: DevicesManager;
  readonly devices: Devices;


  constructor() {
    this.log = defaultLogger;
    this.events = new Events();
    this.host = new Host(this);
    this.drivers = new Drivers(this);
    this.network = new Network(this.drivers, this.host.id, this.host.networkConfig);
    this.services = new Services(this);
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async start() {
    await this.host.$loadConfig();
    await this.drivers.init();
    await this.drivers.$initSystemDrivers();
    await this.initNetwork();
    await this.initMessenger();
    await this.initSystemServices();
    await this.initApp();
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
    // TODO: после загрузки новой версии или конфига - перезагружаться
  }

  /**
   * Init user layer - device representer, devices, device's drivers and services
   * @return {Promise<void>}
   */
  async initApp(): Promise<void> {
    await this.drivers.$initUserLayerDrivers();

    await this.devicesManager.init(this.host.devicesManifests, this.host.config.devices);
    this.devices.init();

    await this.services.init();
  }

}
