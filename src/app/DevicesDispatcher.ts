import App from './App';


export default class DevicesDispatcher {
  private readonly app: App;
  private readonly callActionCategory: string = 'callDeviceAction';

  constructor(app) {
    this.app = app;
    this.app.messenger.listenCategory(this.callActionCategory, this.handleCallAction);
  }

  callAction(deviceId: string, actionName: string, params: Array<any>): Promise<any> {

    // TODO: проверить что actionName есть в манифесте
    // TODO: нужно дождаться пока отработает сама ф-я

    const topic = `${deviceId}/${actionName}`;

    return this.app.messenger.request(this.callActionCategory, topic, params);
  }

  listenStatus(deviceId: string, statusName: string, handler: Function) {

    // TODO: remake

    const device = this.app.devices.getDevice(deviceId);

    device.listenStatus(statusName, handler);
  }

  listenConfig(deviceId: string, handler: Function) {

    // TODO: remake

    const device = this.app.devices.getDevice(deviceId);

    device.listenConfig(handler);
  }

  setConfig(deviceId: string, partialConfig: object) {
    const device = this.app.devices.getDevice(deviceId);

    device.setConfig(partialConfig);
  }

  /**
   * Listen for actions which have to be called on current device.
   */
  private handleCallAction = (deviceId: string, actionName: string, params: Array<any>) => {
    const device = this.app.devices.getDevice(deviceId);

    return device[actionName](...params);
  };

}
