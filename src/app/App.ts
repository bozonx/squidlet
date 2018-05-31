import * as _ from 'lodash';
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
  public readonly config: {[index: string]: object};
  public readonly host: Host;
  public readonly messenger: Messenger;
  public readonly devices: Devices;
  public readonly devicesDispatcher: DevicesDispatcher;
  public readonly drivers: Drivers;
  public readonly router: Router;
  public readonly log: Logger;


  constructor(specifiedConfig) {
    // master config
    this.config = this.mergeConfig(specifiedConfig);
    // config for host
    this.host = new Host(this);
    this.log = defaultLogger;
    this.router = new Router(this);
    this.messenger = new Messenger(this);
    this.drivers = new Drivers(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);

    this.router.init();
    this.messenger.init();
  }

  private mergeConfig(specifiedConfig: object) {
    return _.defaultsDeep({ ...specifiedConfig }, platformConfig, defaultConfig);
  }

}
