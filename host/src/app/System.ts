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
import {EntityClassType} from './entities/EntityManagerBase';
import ConfigSet from './ConfigSet';


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
  readonly configSet: ConfigSet;
  isInitialized: boolean = false;
  // only for initialization time - it will be deleted after it
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }


  constructor() {
    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.events = new Events();
    this.configSet = new ConfigSet(this);
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
      this.log.info(`---> Initializing configs`);
      // TODO: на момент инициализации не инициализирован driversManager
      this.configSet.init();
      // TODO: должен быть после инициализации this.configSet
      await this.host.init();
      this.log.info(`---> Initializing system drivers`);
      await this.driversManager.initSystemDrivers();
      this.riseEvent(eventNames.system.systemDriversInitialized);

      await this.initNetwork();

      this.log.info(`---> Initializing system services`);
      await this.servicesManager.initSystemServices();
      this.riseEvent(eventNames.system.systemServicesInitialized);

      await this.initTopLayer();

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

  async $registerDevs(devs: {[index: string]: EntityClassType}) {
    await this.driversManager.$registerDevs(devs);
  }


  private async initNetwork(): Promise<void> {
    this.log.info(`---> Initializing network`);
    this.network.init(this.host.id, this.host.networkConfig);
    this.riseEvent(eventNames.system.networkInitialized);

    this.log.info(`---> Initializing messenger`);
    this.messenger.init();
    this.devices.init();
    this.riseEvent(eventNames.system.messengerInitialized);
  }

  /**
   * Init top layer - devices, regular drivers and regular services
   */
  private async initTopLayer(): Promise<void> {
    this.log.info(`---> Initializing regular drivers`);
    await this.driversManager.initRegularDrivers();
    this.log.info(`---> Initializing regular services`);
    await this.servicesManager.initRegularServices();
    this.log.info(`---> Initializing devices`);
    await this.devicesManager.init();
  }

  private riseEvent(eventName: string) {
    this.events.emit(categories.system, eventName);
  }

}
