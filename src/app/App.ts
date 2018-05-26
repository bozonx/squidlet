import Messenger from './Messenger';
import Devices from './Devices';
import DevicesDispatcher from './DevicesDispatcher';
import Drivers from './Drivers';
import Router from './Router';


export default class App {
  public readonly messenger: Messenger;
  public readonly devices: Devices;
  public readonly devicesDispatcher: DevicesDispatcher;
  public readonly drivers: Drivers;
  public readonly router: Router;

  constructor() {
    this.messenger = new Messenger(this);
    this.devices = new Devices(this);
    this.devicesDispatcher = new DevicesDispatcher(this);
    this.drivers = new Drivers(this);
    this.router = new Router(this);
  }
}
