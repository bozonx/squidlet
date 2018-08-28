import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './DevicesManager';
import Devices from './Devices';
import DriversManager from './DriversManager';
import Services from './Services';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import FsDev from './interfaces/dev/Fs.dev';


export default class System {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly driversManager: DriversManager;
  readonly network: Network;
  readonly services: Services;
  readonly messenger: Messenger;
  readonly devicesManager: DevicesManager;
  readonly devices: Devices;


  constructor() {
    this.log = defaultLogger;
    this.events = new Events();
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);
    this.network = new Network(this.driversManager.drivers, this.host.id, this.host.networkConfig);
    this.services = new Services(this);
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async start() {
    await this.host.$loadConfig();
    await this.driversManager.$initSystemDrivers();

    // TODO: потом поднять событие что драйверы инициализировались

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
   * Init user layer - device representeur, devices, device's drivers and services
   * @return {Promise<void>}
   */
  async initApp(): Promise<void> {
    await this.driversManager.$initRegularDrivers();
    await this.devicesManager.init();
    this.devices.init();
    await this.services.init();
  }


  // it needs for test purpose
  require(pathToFile: string) {

    // TODO: если на epspuino не будет рабоать с файлами из storage то загрузить файл и сделать eval

    return require(pathToFile);
  }

  async loadJson(filePath: string): Promise<any> {

    // TODO: может будет работать через require на espurino?

    const fs: FsDev = this.driversManager.getDev<FsDev>('fs');
    const systemDriversListString = await fs.readFile(filePath);

    return JSON.stringify(systemDriversListString);
  }

}
