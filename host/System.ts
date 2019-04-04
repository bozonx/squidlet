import Host from './Host';
import Events from './Events';
import LogPublisher from './LogPublisher';
import DevicesManager from './entities/DevicesManager';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import Logger from './interfaces/Logger';
import initializationConfig from './config/initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import eventNames from './dict/eventNames';
import categories from './dict/categories';
import EnvSetLocalFs from './EnvSetLocalFs';
import DevManager, {DevClass} from './entities/DevManager';
import EnvSet from './interfaces/EnvSet';


export default class System {
  readonly events: Events;
  readonly log: Logger;
  readonly devManager: DevManager;
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


  constructor(
    devSet: {[index: string]: DevClass},
    envSetReplacement?: new (system: System) => EnvSet
  ) {
    if (envSetReplacement) {
      this.envSet = new envSetReplacement(this);
    }
    else {
      this.envSet = new EnvSetLocalFs(this);
    }

    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.devManager = new DevManager(devSet);
    this.events = new Events();
    this.log = new LogPublisher(this);
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);
    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
  }


  async start() {
    console.info(`---> Initializing devs`);
    this.devManager.init();

    console.info(`---> Initializing configs`);
    await this.host.init();

    console.info(`---> Initializing system drivers`);
    await this.driversManager.initSystemDrivers();
    this.riseEvent(eventNames.system.systemDriversInitialized);

    console.info(`---> Initializing system services`);
    await this.servicesManager.initSystemServices();
    this.riseEvent(eventNames.system.systemServicesInitialized);

    await this.initTopLayer();

    this._isAppInitialized = true;
    this.riseEvent(eventNames.system.appInitialized);

    // remove initialization config
    delete this.initializationConfig;

    console.info(`===> Host initialization has finished`);
  }

  onDevicesInit(cb: () => void): number {
    // call immediately if devices are initialized
    if (this._isDevicesInitialized) {
      cb();

      return -1;
    }

    return this.events.once(categories.system, eventNames.system.devicesManagerInitialized, cb);
  }

  onAppInit(cb: () => void): number {
    // call immediately if app is initialized
    if (this._isAppInitialized) {
      cb();

      return -1;
    }

    return this.events.once(categories.system, eventNames.system.appInitialized, cb);
  }

  // async $registerDevSet(devs: {[index: string]: DevClass}) {
  //   await this.devManager.registerDevSet(devs);
  // }


  // private async initNetwork(): Promise<void> {
  //   console.info(`---> Initializing network`);
  //   this.network.init(this.host.id, this.host.networkConfig);
  //   this.riseEvent(eventNames.system.networkInitialized);
  //
  //   console.info(`---> Initializing messenger`);
  //   this.messenger.init();
  //   this.devices.init();
  //   this.riseEvent(eventNames.system.messengerInitialized);
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
    this.riseEvent(eventNames.system.devicesManagerInitialized);
  }

  private riseEvent(eventName: string) {
    this.events.emit(categories.system, eventName);
  }

}
