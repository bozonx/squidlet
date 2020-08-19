import DevicesManager from './managers/DevicesManager';
import DriversManager from './managers/DriversManager';
import ServicesManager from './managers/ServicesManager';
import EnvSet from './EnvSet';
import IoSet from './interfaces/IoSet';
import IoManager from './managers/IoManager';
import ApiManager from './managers/ApiManager';
import Context from './Context';
import IndexedEventEmitter from './lib/IndexedEventEmitter';
import {SystemEvents} from './constants';
import {AnyHandler} from './lib/IndexedEvents';
import HostConfig from './interfaces/HostConfig';
import StorageIo from './interfaces/io/StorageIo';
import systemConfig from './systemConfig';


/**
 * It is the main singleton for using in other parts or application.
 */
export default class System {
  readonly context: Context;
  readonly events = new IndexedEventEmitter();
  readonly envSet: EnvSet;
  readonly ioManager: IoManager;
  readonly driversManager: DriversManager;
  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;
  readonly apiManager: ApiManager;

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
   * @param hostConfigOverride - part of HostConfig to overwrite some params
   */
  constructor(ioSet: IoSet, hostConfigOverride?: HostConfig) {
    this.context = new Context(this, hostConfigOverride);
    this.ioManager = new IoManager(this.context, ioSet);
    this.envSet = new EnvSet(this.context);
    this.driversManager = new DriversManager(this.context);
    this.servicesManager = new ServicesManager(this.context);
    this.devicesManager = new DevicesManager(this.context);
    this.apiManager = new ApiManager(this.context);
  }

  /**
   * It destroys the app.
   * Don't call this inside app, to exit call SysIo.exit().
   */
  destroy = async () => {
    this.context.log.info('... destroying System');
    await this.events.emitSync(SystemEvents.beforeDestroy);
    this.context.log.info('... destroying apiManager');
    await this.apiManager.destroy();
    this.context.log.info('... destroying devicesManager');
    await this.devicesManager.destroy();
    this.context.log.info('... destroying servicesManager');
    await this.servicesManager.destroy();
    this.context.log.info('... destroying driversManager');
    await this.driversManager.destroy();
    this.context.log.info('... destroying context');
    this.context.destroy();
    this.context.log.info('System has been successfully destroyed');
    this.events.destroy();
  }


  async start() {
    this.context.log.info(`---> Initializing io`);
    await this.ioManager.init();

    this.context.log.info(`---> Initializing EnvSet`);
    await this.envSet.init();

    this.context.log.info(`---> Initializing context`);
    await this.context.init();

    this.context.log.info(`---> Instantiating entities`);
    await this.driversManager.instantiate();
    await this.servicesManager.instantiate();
    await this.devicesManager.instantiate();

    this.context.log.info(`---> Initializing drivers`);
    await this.driversManager.initialize();
    // TODO: можно вынести в мэнеджер
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

  // TODO: любые события или какие-то определенные ????
  //       Наверное лучше использовать SystemEvents
  addListener(eventName: number | string, cb: AnyHandler): number {
    return this.events.addListener(eventName, cb);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
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
