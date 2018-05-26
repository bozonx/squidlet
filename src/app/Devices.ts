import App from './App';


export default class Devices {
  private readonly app: App;
  // devices by ids
  private readonly devices: object = {};

  constructor(app) {
    this.app = app;
  }

  getDevice(deviceId: string): object {
    // TODO: возвращать по типу BaseDevice или интерфейсу

    return this.devices[deviceId];
  }

}
