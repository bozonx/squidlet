import App from './App';


export default class DevicesDispatcher {
  private readonly app: App;

  constructor(app) {
    this.app = app;
  }

  async callAction(deviceId: string, actionName: string, params: Array<any>): Promise<any> {
    const device = this.app.devices.getDevice(deviceId);

    // TODO: проверить что actionName есть в манифесте

    return device[actionName](...params);
  }

  listenStatus(deviceId: string, statusName: string, handler: Function) {

  }

  listenConfig(deviceId: string, handler: Function) {

  }

}
