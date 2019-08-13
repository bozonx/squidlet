import LogPublisher from './LogPublisher';
import DevicesManager from './entities/DevicesManager';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import initializationConfig from './config/initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import EnvSet from './entities/EnvSet';
import {mergeDeep} from './lib/collections';
import systemConfig from './config/systemConfig';
import IoSet from './interfaces/IoSet';
import IoManager from './entities/IoManager';
import Sessions from './lib/Sessions';
import ApiManager from './ApiManager';
import HostConfig from './interfaces/HostConfig';
import State from './State';
import Api from './Api';
import IndexedEventEmitter from './lib/IndexedEventEmitter';
import {SystemEvents} from './dict/systemEvents';
import {makeUniqId} from './lib/uniqId';


export default class System {
  readonly systemConfig: typeof systemConfig;
  readonly events = new IndexedEventEmitter();
  readonly log: LogPublisher;
  readonly ioManager: IoManager;
  readonly envSet: EnvSet;
  readonly driversManager: DriversManager;
  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;
  readonly sessions: Sessions;
  readonly apiManager: ApiManager;
  readonly api: Api;
  readonly state: State;
  get id(): string {
    return this.config.id;
  }
  get config(): HostConfig {
    return this.hostConfig as HostConfig;
  }

  private hostConfig?: HostConfig;
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
    this.log = new LogPublisher(this);
    this.driversManager = new DriversManager(this);
    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
    this.apiManager = new ApiManager(this);
    this.api = new Api(this);
    this.sessions = new Sessions(makeUniqId);
    this.state = new State();
  }

  destroy = async () => {
    this.log.info('destroying...');
    this.riseEvent(SystemEvents.beforeDestroy);
    await this.devicesManager.destroy();
    await this.servicesManager.destroy();
    await this.driversManager.destroy();
    await this.ioManager.destroy();
    await this.apiManager.destroy();
    this.sessions.destroy();
    this.state.destroy();
    this.events.destroy();
    console.info('System has been successfully destroyed');
  }


  async start() {
    console.info(`---> Initializing io`);
    await this.ioManager.init();

    console.info(`---> Initializing configs`);
    // TODO: нет смыла это сохранять, лучше каждый раз брать из configSet где будет кэш
    this.hostConfig = await this.envSet.loadConfig<HostConfig>(
      this.initCfg.fileNames.hostConfig
    );

    console.info(`---> Initializing system drivers`);
    await this.driversManager.initSystemDrivers();
    this.riseEvent(SystemEvents.systemDriversInitialized);

    console.info(`---> Initializing system services`);
    await this.servicesManager.initSystemServices();
    this.riseEvent(SystemEvents.systemServicesInitialized);

    await this.initTopLayer();

    this._isAppInitialized = true;
    this.riseEvent(SystemEvents.appInitialized);

    // remove initialization config
    delete this.initializationConfig;

    console.info(`===> System initialization has been finished`);
  }

  onDevicesInit(cb: () => void): number {
    // call immediately if devices are initialized
    if (this._isDevicesInitialized) {
      cb();

      return -1;
    }

    return this.events.once(SystemEvents.devicesInitialized, cb);
  }

  onAppInit(cb: () => void): number {
    // call immediately if app is initialized
    if (this._isAppInitialized) {
      cb();

      return -1;
    }

    return this.events.once(SystemEvents.appInitialized, cb);
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
    this.riseEvent(SystemEvents.devicesInitialized);
  }

  private riseEvent(eventName: number) {
    this.events.emit(eventName);
  }

}
