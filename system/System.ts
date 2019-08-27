import DevicesManager from './managers/DevicesManager';
import DriversManager from './managers/DriversManager';
import ServicesManager from './managers/ServicesManager';
import EnvSet from './EnvSet';
import IoSet from './interfaces/IoSet';
import IoManager from './managers/IoManager';
import ApiManager from './managers/ApiManager';
import Api from './Api';
import Context from './Context';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './config/initializationConfig';
import IndexedEventEmitter from './lib/IndexedEventEmitter';
import {AppLifeCycleEvents} from './constants';
import {ShutdownReason} from './interfaces/ShutdownReason';


export type ShutdownHandler = (reason: ShutdownReason) => void;


export default class System {
  readonly shutdownRequest: ShutdownHandler;
  readonly context: Context;
  readonly events = new IndexedEventEmitter();
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


  constructor(
    ioSet: IoSet,
    shutdownRequestCb: ShutdownHandler,
    systemConfigExtend?: {[index: string]: any}
  ) {
    this.shutdownRequest = shutdownRequestCb;
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
    this.events.emit(AppLifeCycleEvents.beforeDestroy);
    await this.apiManager.destroy();
    await this.devicesManager.destroy();
    await this.servicesManager.destroy();
    await this.driversManager.destroy();
    await this.ioManager.destroy();
    this.context.destroy();
    this.events.destroy();
    console.info('System has been successfully destroyed');
  }


  async start() {
    console.info(`---> Initializing io`);
    await this.ioManager.init();

    console.info(`---> Initializing context`);
    await this.context.init();

    console.info(`---> Initializing system drivers`);
    await this.driversManager.initSystemDrivers();

    console.info(`---> Initializing system services`);
    await this.servicesManager.initSystemServices();

    await this.initTopLayer();

    this._isAppInitialized = true;
    await this.events.emitSync(AppLifeCycleEvents.appInitialized);

    // remove initialization config
    delete this._initializationConfig;

    console.info(`===> System initialization has been finished`);
  }


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
    await this.events.emitSync(AppLifeCycleEvents.devicesInitialized);
  }

}
