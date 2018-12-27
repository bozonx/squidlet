import Network from '../network/Network';
import Host from './Host';
import Events from './Events';
import LogPublisher from './LogPublisher';
import Messenger from '../messenger/Messenger';
import DevicesManager from './entities/DevicesManager';
import Devices from './Devices';
import DriversManager from './entities/DriversManager';
import ServicesManager from './entities/ServicesManager';
import Logger from './interfaces/Logger';
import initializationConfig from './config/initializationConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import eventNames from './dict/eventNames';
import categories from './dict/categories';
import ConfigSet from './ConfigSet';
import DevManager, {DevClass} from './entities/DevManager';
import SysFs from './SysFs';


export default class System {
  readonly events: Events;
  readonly log: Logger;
  readonly devManager: DevManager;

  readonly sysFs: SysFs;
  readonly configSet: ConfigSet;
  readonly host: Host;
  readonly driversManager: DriversManager;

  readonly network: Network;
  readonly messenger: Messenger;
  readonly devices: Devices;

  readonly servicesManager: ServicesManager;
  readonly devicesManager: DevicesManager;

  private _isInitialized: boolean = false;
  // only for initialization time - it will be deleted after it
  private initializationConfig?: InitializationConfig;

  get initCfg(): InitializationConfig {
    return this.initializationConfig as InitializationConfig;
  }

  get isInitialized() {
    return this._isInitialized;
  }


  constructor() {
    // config which is used only on initialization time
    this.initializationConfig = initializationConfig();

    this.events = new Events();
    this.log = new LogPublisher(this);
    this.devManager = new DevManager();

    this.sysFs = new SysFs(this);
    this.configSet = new ConfigSet(this);
    this.host = new Host(this);
    this.driversManager = new DriversManager(this);

    this.network = new Network(this.driversManager.env);
    this.messenger = new Messenger(this);
    this.devices = new Devices(this);

    this.servicesManager = new ServicesManager(this);
    this.devicesManager = new DevicesManager(this);
  }


  async start() {
    //try {
      this.log.info(`---> Initializing devs`);
      this.devManager.init();

      this.log.info(`---> Initializing configs`);
      //this.configSet.init();
      await this.host.init();

      this.log.info(`---> Initializing system drivers`);
      await this.driversManager.initSystemDrivers();
      this.riseEvent(eventNames.system.systemDriversInitialized);

      await this.initNetwork();

      this.log.info(`---> Initializing system services`);
      await this.servicesManager.initSystemServices();
      this.riseEvent(eventNames.system.systemServicesInitialized);

      await this.initTopLayer();

      this._isInitialized = true;
      this.riseEvent(eventNames.system.appInitialized);

      // remove initialization config
      delete this.initializationConfig;

      this.log.info(`===> Host initialization has finished`);
    // }
    // catch (err) {
    //
    //   // TODO: не срабатывает
    //   //this.log.error(`Can't start host system: ${String(err)}`);
    //   throw new Error(`Can't start host system: ${String(err)}`);
    // }
  }

  onAppInit(cb: () => void): number {
    return this.events.once(categories.system, eventNames.system.appInitialized, cb);
  }

  async $registerDevSet(devs: {[index: string]: DevClass}) {
    await this.devManager.registerDevSet(devs);
  }


  private async initNetwork(): Promise<void> {
    this.log.info(`---> Initializing network`);
    this.network.init(this.host.id, this.host.networkConfig);
    this.riseEvent(eventNames.system.networkInitialized);

    this.log.info(`---> Initializing messenger`);
    this.messenger.init();
    this.devices.init();
    this.riseEvent(eventNames.system.messengerInitialized);
  }

  /**
   * Init top layer - devices, regular drivers and regular services
   */
  private async initTopLayer(): Promise<void> {
    this.log.info(`---> Initializing regular drivers`);
    await this.driversManager.initRegularDrivers();
    this.log.info(`---> Initializing regular services`);
    await this.servicesManager.initRegularServices();
    this.log.info(`---> Initializing devices`);
    await this.devicesManager.init();
  }

  private riseEvent(eventName: string) {
    this.events.emit(categories.system, eventName);
  }

}
