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
import {SystemEvents} from './constants';
import {ShutdownReason} from './interfaces/ShutdownReason';
import Logger from './interfaces/Logger';
import LogLevel from './interfaces/LogLevel';


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

  get wasDriversInitialized(): boolean {
    return this._wasDriversInitialized;
  }
  get wasServicesInitialized(): boolean {
    return this._wasServicesInitialized;
  }
  get wasDevicesInitialized(): boolean {
    return this._wasDevicesInitialized;
  }
  get wasAppInitialized(): boolean {
    return this._wasAppInitialized;
  }

  private _wasDriversInitialized: boolean = false;
  private _wasServicesInitialized: boolean = false;
  private _wasDevicesInitialized: boolean = false;
  private _wasAppInitialized: boolean = false;


  /**
   * The main app.
   * @param ioSet - has to be initialized before
   * @param shutdownRequestCb - handler of shutdown request
   * @param logger - external logger
   */
  constructor(ioSet: IoSet, shutdownRequestCb: ShutdownHandler, logger?: Logger) {
    this.shutdownRequest = shutdownRequestCb;
    this.context = new Context(this);
    this.ioManager = new IoManager(this.context, ioSet);
    this.envSet = new EnvSet(this.context);
    this.driversManager = new DriversManager(this.context);
    this.servicesManager = new ServicesManager(this.context);
    this.devicesManager = new DevicesManager(this.context);
    this.apiManager = new ApiManager(this.context);
    this.api = new Api(this.context);

    // send logs to an external logger to catch logs on initialization time
    if (logger) {
      this.events.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
        logger[level](message);
      });
    }
  }

  destroy = async () => {
    this.context.log.info('... destroying System');
    await this.events.emitSync(SystemEvents.beforeDestroy);
    await this.apiManager.destroy();
    await this.devicesManager.destroy();
    await this.servicesManager.destroy();
    await this.driversManager.destroy();
    this.context.destroy();
    this.events.destroy();
    this.context.log.info('System has been successfully destroyed');
  }


  async start() {
    this.context.log.info(`---> Initializing io`);
    await this.ioManager.init();

    this.context.log.info(`---> Initializing context`);
    await this.context.init();

    this.context.log.info(`---> Instantiating entities`);
    await this.driversManager.instantiate();
    await this.servicesManager.instantiate();
    await this.devicesManager.instantiate();

    this.context.log.info(`---> Initializing drivers`);
    await this.driversManager.initialize();
    this._wasDriversInitialized = true;
    await this.emitEventSync(SystemEvents.driversInitialized);

    this.context.log.info(`---> Initializing system services`);
    await this.servicesManager.initialize();
    this._wasServicesInitialized = true;
    await this.emitEventSync(SystemEvents.servicesInitialized);

    this.context.log.info(`---> Initializing devices`);
    await this.devicesManager.initialize();

    this.context.log.info(`---> start after devices initialized handlers`);
    this._wasDevicesInitialized = true;
    await this.emitEventSync(SystemEvents.devicesInitialized);

    this.context.log.info(`---> start after app initialized handlers`);
    this._wasAppInitialized = true;
    await this.emitEventSync(SystemEvents.appInitialized);

    this.context.log.info(`===> System initialization has been finished`);
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
