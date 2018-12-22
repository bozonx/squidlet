import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import LogPublisher from './LogPublisher';
import Messenger from '../messenger/Messenger';
import DevicesManager from './entities/DevicesManager';
import Devices from './Devices';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import Logger from './interfaces/Logger';
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
  isInitialized: boolean = false;
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
    this.events = new Events();
    this.host = new Host(this);

    // TODO: если при инициализации нужно вывести log то будет ошибка - так как log ещё не инициализирован

    this.log = new LogPublisher(this);

    this.driversManager = new DriversManager(this);

    // TODO: тут уже нужен id - а где его взять если ещё не инициализировали host???

    this.network = new Network(this.driversManager.env);
    this.messenger = new Messenger(this);

    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
    this.devices = new Devices(this);
  }

  async start() {
    try {
      // runtime config
      await this.host.init();
      await this.driversManager.initSystemDrivers();
      this.riseEvent(eventNames.system.systemDriversInitialized);

      this.network.init(this.host.id, this.host.networkConfig);
      this.riseEvent(eventNames.system.networkInitialized);

      this.messenger.init();
      this.devices.init();
      this.riseEvent(eventNames.system.messengerInitialized);

      await this.servicesManager.initSystemServices();
      this.riseEvent(eventNames.system.systemServicesInitialized);

      await this.initApp();
      this.isInitialized = true;
      this.riseEvent(eventNames.system.appInitialized);

      // remove initialization config
      delete this.initializationConfig;

      this.log.info(`===> Host initialization has finished`);
    }
    catch (err) {
      this.log.error(`Can't start host system: ${String(err)}`);
    }
  }

  onAppInit(cb: () => void): number {
    return this.events.once(categories.system, eventNames.system.appInitialized, cb);
  }

  $registerConfigSetManager(ConfigSetManager: new (system: System) => ConfigSetManager) {
    this.configSetManager = new ConfigSetManager(this);
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
    await this.servicesManager.initRegularServices();
    await this.devicesManager.init();
  }

  private riseEvent(eventName: string) {
    // TODO: лучше поднять события через мессенджер или сэмитировать Message. Но непонятно откуда взять hostid
    this.events.emit(categories.system, eventName);
  }

}
