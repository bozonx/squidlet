import DevicesManager from './entities/DevicesManager';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import EnvSet from './entities/EnvSet';
import IoSet from './interfaces/IoSet';
import IoManager from './entities/IoManager';
import ApiManager from './ApiManager';
import Api from './Api';
import Context, {AppLifeCycleEvents} from './Context';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './config/initializationConfig';


export default class System {
  readonly context: Context;
  readonly envSet: EnvSet;
  readonly ioManager: IoManager;
  readonly driversManager: DriversManager;
  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;
  readonly apiManager: ApiManager;
  readonly api: Api;

  get initializationConfig(): InitializationConfig {
    return this._initializationConfig as InitializationConfig;
  }
  get isDevicesInitialized(): boolean {
    return this._isDevicesInitialized;
  }
  get isAppInitialized(): boolean {
    return this._isAppInitialized;
  }

  // only for initialization time - it will be deleted after it
  private _initializationConfig?: InitializationConfig;
  private _isDevicesInitialized: boolean = false;
  private _isAppInitialized: boolean = false;


  constructor(ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) {
    // config which is used only on initialization time
    this._initializationConfig = initializationConfig();
    this.context = new Context(this, systemConfigExtend);
    this.ioManager = new IoManager(this.context, ioSet);
    this.envSet = new EnvSet(this.context);
    this.driversManager = new DriversManager(this.context);
    this.servicesManager = new ServicesManager(this.context);
    this.devicesManager = new DevicesManager(this.context);
    this.apiManager = new ApiManager(this.context);
    this.api = new Api(this.context);
  }

  destroy = async () => {
    this.context.log.info('destroying...');
    this.riseSystemEvent(AppLifeCycleEvents.beforeDestroy);
    await this.apiManager.destroy();
    await this.devicesManager.destroy();
    await this.servicesManager.destroy();
    await this.driversManager.destroy();
    await this.ioManager.destroy();
    this.context.destroy();
    console.info('System has been successfully destroyed');
  }


  async start() {
    console.info(`---> Initializing io`);
    await this.ioManager.init();

    console.info(`---> Initializing configs`);
    await this.context.initConfig();

    console.info(`---> Initializing system drivers`);
    await this.driversManager.initSystemDrivers();
    this.riseSystemEvent(AppLifeCycleEvents.systemDriversInitialized);

    console.info(`---> Initializing system services`);
    await this.servicesManager.initSystemServices();
    this.riseSystemEvent(AppLifeCycleEvents.systemServicesInitialized);

    await this.initTopLayer();

    this._isAppInitialized = true;
    this.riseSystemEvent(AppLifeCycleEvents.appInitialized);

    // remove initialization config
    delete this._initializationConfig;

    console.info(`===> System initialization has been finished`);
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
    this.riseSystemEvent(AppLifeCycleEvents.devicesInitialized);
  }


  private riseSystemEvent(eventName: number) {
    this.context.events.emit(eventName);
  }

}
