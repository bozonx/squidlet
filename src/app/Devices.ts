import App from './App';
import Device from './interfaces/Device';


export default class Devices {
  private readonly app: App;
  // devices by ids
  private readonly devices: object = {};

  constructor(app) {
    this.app = app;
  }

  getDevice(deviceId: string): Device {
    return this.devices[deviceId];
  }

}
