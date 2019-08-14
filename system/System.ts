import DevicesManager from './entities/DevicesManager';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import EnvSet from './entities/EnvSet';
import IoSet from './interfaces/IoSet';
import IoManager from './entities/IoManager';
import ApiManager from './ApiManager';
import HostConfig from './interfaces/HostConfig';
import Api from './Api';
import Context, {AppLifeCycleEvents} from './Context';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './config/initializationConfig';


export default class System {
  readonly context: Context;
  readonly ioManager: IoManager;
  readonly envSet: EnvSet;
  readonly driversManager: DriversManager;
  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;
  readonly apiManager: ApiManager;
  readonly api: Api;
  // only for initialization time - it will be deleted after it
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }


  constructor(ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) {
    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();
    this.ioManager = new IoManager(this, ioSet);
    this.envSet = new EnvSet(this);
    this.driversManager = new DriversManager(this);
    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
    this.apiManager = new ApiManager(this);
    this.api = new Api(this);
    this.context = new Context(this, systemConfigExtend);
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
    // TODO: нет смыла это сохранять, лучше каждый раз брать из configSet где будет кэш
    this.hostConfig = await this.envSet.loadConfig<HostConfig>(
      this.initCfg.fileNames.hostConfig
    );

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
    delete this.initializationConfig;

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
