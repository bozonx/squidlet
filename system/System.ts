import DevicesManager from './managers/DevicesManager';
import DriversManager from './managers/DriversManager';
import ServicesManager from './managers/ServicesManager';
import EnvSet from './EnvSet';
import IoSet from './interfaces/IoSet';
import IoManager from './managers/IoManager';
import ApiManager from './managers/ApiManager';
import Api from './Api';
import Context from './Context';
import IndexedEventEmitter from './lib/IndexedEventEmitter';
import {AppLifeCycleEvents} from './constants';
import {ShutdownReason} from './interfaces/ShutdownReason';
import Logger from './interfaces/Logger';


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

  get isDevicesInitialized(): boolean {
    return this._isDevicesInitialized;
  }
  get isAppInitialized(): boolean {
    return this._isAppInitialized;
  }

  private _isDevicesInitialized: boolean = false;
  private _isAppInitialized: boolean = false;
  private readonly logger: Logger;


  /**
   * The main app.
   * @param ioSet - has to be initialized before
   * @param shutdownRequestCb - handler of shutdown request
   * @param logger - external logger
   */
  constructor(ioSet: IoSet, shutdownRequestCb: ShutdownHandler, logger: Logger) {
    this.shutdownRequest = shutdownRequestCb;
    this.logger = logger;
    this.context = new Context(this);
    this.ioManager = new IoManager(this.context, ioSet);
    this.envSet = new EnvSet(this.context);
    this.driversManager = new DriversManager(this.context);
    this.servicesManager = new ServicesManager(this.context);
    this.devicesManager = new DevicesManager(this.context);
    this.apiManager = new ApiManager(this.context);
    this.api = new Api(this.context);
  }

  destroy = async () => {
    this.context.log.info('... destroying System');
    await this.events.emitSync(AppLifeCycleEvents.beforeDestroy);
    await this.apiManager.destroy();
    await this.devicesManager.destroy();
    await this.servicesManager.destroy();
    await this.driversManager.destroy();
    this.context.destroy();
    this.events.destroy();
    console.info('System has been successfully destroyed');
  }


  async start() {
    console.info(`---> Initializing io`);
    await this.ioManager.init();

    console.info(`---> Initializing context`);
    await this.context.init();

    console.info(`---> Instantiating entities`);
    await this.driversManager.instantiate();
    await this.servicesManager.instantiate();
    await this.devicesManager.instantiate();

    console.info(`---> Initializing drivers`);
    await this.driversManager.initialize();

    console.info(`---> Initializing system services`);
    await this.servicesManager.initialize();

    console.info(`---> Initializing devices`);
    await this.devicesManager.initialize();

    this._isDevicesInitialized = true;
    await this.emitEventSync(AppLifeCycleEvents.devicesInitialized);

    this._isAppInitialized = true;
    await this.emitEventSync(AppLifeCycleEvents.appInitialized);

    console.info(`===> System initialization has been finished`);
  }


  private async emitEventSync(eventName: number) {
    try {
      await this.events.emitSync(eventName);
    }
    catch (err) {
      this.context.log.error(err);
    }
  }

}
