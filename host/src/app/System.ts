import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './DevicesManager';
import Devices from './Devices';
import DriversManager from './DriversManager';
import ServicesManager from './ServicesManager';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import FsDev from './interfaces/dev/Fs.dev';
import initializationConfig from './initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';


export default class System {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly driversManager: DriversManager;
  readonly network: Network;
  readonly servicesManager: ServicesManager;
  readonly messenger: Messenger;
  readonly devicesManager: DevicesManager;
  readonly devices: Devices;
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }

  constructor() {
    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.log = defaultLogger;
    this.events = new Events();
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);
    this.network = new Network(this.driversManager.drivers, this.host.id, this.host.networkConfig);
    this.servicesManager = new ServicesManager(this);
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async start() {
    // runtime config
    await this.host.$loadConfig();
    await this.driversManager.initSystemDrivers();
    this.riseEvent('system.systemDriversInitialized');

    this.network.init();
    this.riseEvent('system.networkInitialized');

    this.messenger.init();
    this.riseEvent('system.messengerInitialized');

    await this.servicesManager.initSystemServices();
    this.riseEvent('system.systemServicesInitialized');

    await this.initApp();
    this.riseEvent('system.appInitialized');

    // remove initialization config
    delete this.initializationConfig;
  }

  /**
   * Init user layer - device representeur, devices, device's drivers and services
   * @return {Promise<void>}
   */
  async initApp(): Promise<void> {
    await this.driversManager.initRegularDrivers();
    await this.devicesManager.init();
    this.devices.init();
    await this.servicesManager.initRegularServices();
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

  private riseEvent(eventName: string) {
    // TODO: это общие события или чисто для System?
  }

}
