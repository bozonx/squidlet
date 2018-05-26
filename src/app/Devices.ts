import App from './App';
import DeviceInterface from './DeviceInterface';


export default class Devices {
  private readonly app: App;
  // devices by ids
  private readonly devices: object = {};

  constructor(app) {
    this.app = app;
  }

  getDevice(deviceId: string): DeviceInterface {
    return this.devices[deviceId];
  }

}
