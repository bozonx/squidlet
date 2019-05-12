import Host from './Host';
import CategorizedEvents from './helpers/CategorizedEvents';
import LogPublisher from './LogPublisher';
import DevicesManager from './entities/DevicesManager';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import initializationConfig from './config/initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import topics from './dict/topics';
import categories from './dict/categories';
import EnvSet from './entities/EnvSet';
import SystemConfig from './interfaces/SystemConfig';
import {mergeDeep} from './helpers/collections';
import systemConfig from './config/systemConfig';
import IoSet from './interfaces/IoSet';
import IoSetLocal from './IoSetLocal';
import IoManager from './entities/IoManager';


export default class System {
  readonly systemConfig: SystemConfig;
  readonly events: CategorizedEvents;
  readonly log: LogPublisher;
  readonly ioManager: IoManager;
  readonly envSet: EnvSet;
  readonly host: Host;
  readonly driversManager: DriversManager;
  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;

  private _isDevicesInitialized: boolean = false;
  private _isAppInitialized: boolean = false;
  // only for initialization time - it will be deleted after it
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }

  get isInitialized() {
    return this._isAppInitialized;
  }


  constructor(ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) {
    this.ioManager = new IoManager(this, ioSet);
    this.systemConfig = mergeDeep(systemConfigExtend, systemConfig) as any;
    this.envSet = new EnvSet(this);

    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.events = new CategorizedEvents(this.systemConfig.eventNameSeparator);
    this.log = new LogPublisher(this);
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);
    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
  }


  async start() {
    console.info(`---> Initializing io`);
    await this.ioManager.init();

    console.info(`---> Initializing configs`);
    await this.host.init();

    console.info(`---> Initializing system drivers`);
    await this.driversManager.initSystemDrivers();
    this.riseEvent(topics.system.systemDriversInitialized);

    console.info(`---> Initializing system services`);
    await this.servicesManager.initSystemServices();
    this.riseEvent(topics.system.systemServicesInitialized);

    await this.initTopLayer();

    this._isAppInitialized = true;
    this.riseEvent(topics.system.appInitialized);

    // remove initialization config
    delete this.initializationConfig;

    console.info(`===> System initialization has finished`);
  }

  onDevicesInit(cb: () => void): number {
    // call immediately if devices are initialized
    if (this._isDevicesInitialized) {
      cb();

      return -1;
    }

    return this.events.once(categories.system, topics.system.devicesManagerInitialized, cb);
  }

  onAppInit(cb: () => void): number {
    // call immediately if app is initialized
    if (this._isAppInitialized) {
      cb();

      return -1;
    }

    return this.events.once(categories.system, topics.system.appInitialized, cb);
  }

  // private async initNetwork(): Promise<void> {
  //   console.info(`---> Initializing network`);
  //   this.network.init(this.host.id, this.host.networkConfig);
  //   this.riseEvent(topics.system.networkInitialized);
  //
  //   console.info(`---> Initializing messenger`);
  //   this.messenger.init();
  //   this.devices.init();
  //   this.riseEvent(topics.system.messengerInitialized);
  // }

  /**
   * Init top layer - devices, regular drivers and regular services
   */
  private async initTopLayer(): Promise<void> {
    console.info(`---> Initializing regular drivers`);
    await this.driversManager.initRegularDrivers();
    console.info(`---> Initializing regular services`);
    await this.servicesManager.initRegularServices();
    console.info(`---> Initializing devices`);
    await this.devicesManager.init();
    this._isDevicesInitialized = true;
    this.riseEvent(topics.system.devicesManagerInitialized);
  }

  private riseEvent(eventName: string) {
    this.events.emit(categories.system, eventName);
  }

}
