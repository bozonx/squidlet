import * as _ from 'lodash';
import MasterConfigurator from './MasterConfigurator';
import Host from './Host';
import Messenger from './Messenger';
import Devices from './Devices';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Router from './Router';
import Logger from './interfaces/Logger';
import * as defaultLogger from './defaultLogger';
import defaultConfig from './defaultConfig';
import platformConfig from './platformConfig';


export default class App {
  //public readonly config: {[index: string]: object};
  readonly masterConfigurator: MasterConfigurator;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;
  readonly devicesDispatcher: DevicesDispatcher;
  readonly drivers: Drivers;
  readonly router: Router;
  readonly log: Logger;
  private readonly masterConfig: object | undefined;


  constructor(masterConfig: object | undefined) {
    if (masterConfig) {
      this.masterConfigurator = new MasterConfigurator(this);
      this.masterConfig = this.mergeConfig(masterConfig);
    }

    // config for current host
    this.host = new Host(this);
    this.log = defaultLogger;
    this.router = new Router(this);
    this.messenger = new Messenger(this);
    this.drivers = new Drivers(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
  }

  async init(): Promise<void> {
    await this.devices.init(this.host.devicesManifests, this.host.devicesConfigs);
    this.router.init();
    this.messenger.init();
    this.devicesDispatcher.init();
  }

  private mergeConfig(specifiedConfig: object) {
    return _.defaultsDeep({ ...specifiedConfig }, platformConfig, defaultConfig);
  }

}
