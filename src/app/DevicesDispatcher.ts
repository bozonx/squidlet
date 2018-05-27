import _ from 'lodash';
import App from './App';
import MessageInterface from "./MessageInterface";


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

    const to = this.resolveHost(deviceId);
    const topic = `${deviceId}/${actionName}`;

    return this.app.messenger.request(to, this.callActionCategory, topic, params);
  }

  listenStatus(deviceId: string, statusName: string, handler: Function) {

    // TODO: remake

    // const device = this.app.devices.getDevice(deviceId);
    // device.listenStatus(statusName, handler);
  }

  listenConfig(deviceId: string, handler: Function) {

    // TODO: remake

    // const device = this.app.devices.getDevice(deviceId);
    // device.listenConfig(handler);
  }

  setConfig(deviceId: string, partialConfig: object) {
    const device = this.app.devices.getDevice(deviceId);

    device.setConfig(partialConfig);
  }


  /**
   * Listen for actions which have to be called on current device.
   */
  private handleCallAction = async (message: MessageInterface): Promise<any> => {
    const [ deviceId, actionName ] = message.topic.split('/');

    if (!_.isArray(message.payload)) {
      throw new Error(`Payload of calling action has to be an array. Message: ${JSON.stringify(message)}`);
    }
    if (!actionName) {
      throw new Error(`You have to specify an actionName like this: { topic: deviceId/actionName } . Message: ${JSON.stringify(message)}`);
    }

    const device = this.app.devices.getDevice(deviceId);
    const result = await device[actionName](...message.payload);

    return result;
  };

  private resolveHost(deviceId: string): string {

    // TODO: !!!!

    return '';
  }

}
