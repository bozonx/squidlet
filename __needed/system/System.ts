import DevicesManager from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/DevicesManager.js';
import DriversManager from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/DriversManager.js';
import ServicesManager from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/ServicesManager.js';
import EnvSet from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/EnvSet.js';
import IoSet from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoSet.js';
import IoManager from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/IoManager.js';
import ApiManager from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/ApiManager.js';
import Context from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import IndexedEventEmitter from '../../../squidlet-lib/src/IndexedEventEmitter';
import {SystemEvents} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';
import {AnyHandler} from '../../../squidlet-lib/src/IndexedEvents';
import HostConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostConfig.js';
import StorageIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import systemConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';


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
  constructor(ioSet: IoSet, hostConfigOverride?: Partial<HostConfig>) {
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
