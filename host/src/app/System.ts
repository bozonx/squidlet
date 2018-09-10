import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import Messenger from '../messenger/Messenger';
import DevicesManager from './entities/DevicesManager';
import Devices from './Devices';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import initializationConfig from './config/initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import eventNames from './dict/eventNames';
import categories from './dict/categories';
import ConfigSetManager from './interfaces/ConfigSetManager';
import {EntityClassType} from './entities/EntityManagerBase';


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
  private configSetManager?: ConfigSetManager;
  // only for initialization time - it will be deleted after it
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }

  get configSet(): ConfigSetManager {
    return this.configSetManager as ConfigSetManager;
  }

  constructor() {
    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.log = defaultLogger;
    this.events = new Events();
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);
    this.network = new Network(this.driversManager.env, this.host.id, this.host.networkConfig);
    this.servicesManager = new ServicesManager(this);
    this.messenger = new Messenger(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async start() {
    // runtime config
    await this.host.init();
    await this.driversManager.initSystemDrivers();
    this.riseEvent(eventNames.system.systemDriversInitialized);

    this.network.init();
    this.riseEvent(eventNames.system.networkInitialized);

    this.messenger.init();
    this.riseEvent(eventNames.system.messengerInitialized);

    await this.servicesManager.initSystemServices();
    this.riseEvent(eventNames.system.systemServicesInitialized);

    await this.initApp();
    this.riseEvent(eventNames.system.appInitialized);

    // remove initialization config
    delete this.initializationConfig;
  }

  $registerConfigSetManager(configSetManager: ConfigSetManager) {
    this.configSetManager = configSetManager;
    this.configSetManager.init(this);
  }

  async $registerDevs(devs: {[index: string]: EntityClassType}) {
    await this.driversManager.$registerDevs(devs);
  }

  /**
   * Init user layer - device representeur, devices, device's drivers and services
   * @return {Promise<void>}
   */
  private async initApp(): Promise<void> {
    await this.driversManager.initRegularDrivers();
    await this.devicesManager.init();
    this.devices.init();
    await this.servicesManager.initRegularServices();
  }

  private riseEvent(eventName: string) {
    this.events.emit(categories.system, eventName);
  }

}
