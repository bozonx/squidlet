import _ from 'lodash';
import Messenger from './Messenger';
import Devices from './Devices';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Router from './Router';
import LoggerInterface from './interfaces/LoggerInterface';
import * as defaultLogger from './defaultLogger';
import defaultConfig from './defaultConfig';
import platformConfig from './platformConfig';


export default class App {
  public readonly messenger: Messenger;
  public readonly devices: Devices;
  public readonly devicesDispatcher: DevicesDispatcher;
  public readonly drivers: Drivers;
  public readonly router: Router;
  public readonly log: LoggerInterface;
  public readonly config: object;

  constructor(specifiedConfig) {
    this.config = this.mergeConfig(specifiedConfig);
    this.messenger = new Messenger(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
    this.drivers = new Drivers(this);
    this.router = new Router(this);
    this.log = defaultLogger;
  }

  getHostId(): string {

    // TODO: return id of current host

    return 'master';
  }


  private mergeConfig(specifiedConfig: object) {
    return _.defaultsDeep({ ...specifiedConfig }, platformConfig, defaultConfig);
  }

}
