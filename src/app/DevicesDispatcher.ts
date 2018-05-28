import _ from 'lodash';
import App from './App';
import MessageInterface from "./interfaces/MessageInterface";


export default class DevicesDispatcher {
  private readonly app: App;
  private readonly callActionCategory: string = 'deviceCallAction';
  private readonly deviceFeedBackCategory: string = 'deviceFeedBack';
  private readonly statusTopic: string = 'status';
  private readonly configTopic: string = 'config';

  constructor(app) {
    this.app = app;
    // listen messages to call actions of local device
    this.app.messenger.listenRequests(this.callActionCategory, this.handleCallActionRequests);
  }

  callAction(deviceId: string, actionName: string, params: Array<any>): Promise<any> {

    // TODO: проверить что actionName есть в манифесте

    const to = this.resolveHost(deviceId);
    const topic = `${deviceId}/${actionName}`;

    return this.app.messenger.request(to, this.callActionCategory, topic, params);
  }

  /**
   * Listen for device's status messages.
   */
  listenStatus(deviceId: string, handler: (statusName: string, partialStatus: object) => void) {
    const callBack = (message: MessageInterface) => {
      handler(message.payload.statusName, message.payload.partialStatus);
    };

    this.app.messenger.subscribe(this.deviceFeedBackCategory, this.statusTopic, callBack)
  }

  listenConfig(deviceId: string, handler: (partialConfig: object) => void) {
    const callBack = (message: MessageInterface) => {
      handler(message.payload.partialConfig);
    };

    this.app.messenger.subscribe(this.deviceFeedBackCategory, this.configTopic, callBack)
  }

  setConfig(deviceId: string, partialConfig: object) {
    const to = this.resolveHost(deviceId);
    const topic = `${deviceId}/setConfig`;

    return this.app.messenger.request(to, this.callActionCategory, topic, partialConfig);
  }

  /**
   * It runs from local device itself to publish its status changes.
   */
  publishStatus(deviceId: string, statusName: string, partialStatus: object): Promise<void> {

    // TODO: должен путликовать всем желающим - кто подписался

    const to = 'master';
    const payload = {
      statusName,
      partialStatus,
    };

    return this.app.messenger.publish(to, this.deviceFeedBackCategory, this.statusTopic, payload);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {

    // TODO: должен путликовать всем желающим - кто подписался

    const to = 'master';
    const payload = {
      partialConfig,
    };

    return this.app.messenger.publish(to, this.deviceFeedBackCategory, this.configTopic, payload);
  }

  /**
   * Listen for actions which have to be called on current host.
   */
  private handleCallActionRequests = (request: MessageInterface): Promise<any> => {

    // TODO: сформировать ответ

    return this.callLocalDeviceAction(request)
      .then((result: any) => {
        //this.sendRespondMessage(message, result);
      })
      .catch((error) => {
        //this.sendRespondMessage(message, null, error);
      });

    // this.sendRespondMessage(message, result);

  };

  private async callLocalDeviceAction(request: MessageInterface): Promise<any> {
    const [ deviceId, actionName ] = request.topic.split('/');

    if (!_.isArray(request.payload)) {
      throw new Error(`
        Payload of calling action has to be an array.
        Request: ${JSON.stringify(request)}
      `);
    }
    if (!actionName) {
      throw new Error(`
        You have to specify an actionName like this: { topic: deviceId/actionName } .
        Request: ${JSON.stringify(request)}
      `);
    }

    const device = this.app.devices.getDevice(deviceId);
    const result = await device[actionName](...request.payload);

    return result;
  }

  private resolveHost(deviceId: string): string {

    // TODO: !!!!

    return '';
  }

}
