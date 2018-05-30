import * as _ from 'lodash';
import App from './App';
import Message from "./interfaces/Message";
import Destination from "./interfaces/Destination";


export default class DevicesDispatcher {
  private readonly app: App;
  private readonly callActionCategory: string = 'deviceCallAction';
  private readonly deviceFeedBackCategory: string = 'deviceFeedBack';
  private readonly statusTopic: string = 'status';
  private readonly configTopic: string = 'config';

  constructor(app) {
    this.app = app;
    // listen messages to call actions of local device
    this.app.messenger.listenIncomeRequests(this.callActionCategory, this.handleCallActionRequests);
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
    const callback = (message: Message) => {
      handler(message.payload.statusName, message.payload.partialStatus);
    };

    this.app.messenger.subscribe(this.deviceFeedBackCategory, this.statusTopic, callback)
  }

  listenConfig(deviceId: string, handler: (partialConfig: object) => void) {
    const callback = (message: Message) => {
      handler(message.payload.partialConfig);
    };

    this.app.messenger.subscribe(this.deviceFeedBackCategory, this.configTopic, callback)
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

    const to = this.resolveHost('master');
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

    // TODO: должен публиковать всем желающим - кто подписался

    const to = this.resolveHost('master');
    const payload = {
      partialConfig,
    };

    return this.app.messenger.publish(to, this.deviceFeedBackCategory, this.configTopic, payload);
  }

  /**
   * Listen for actions which have to be called on current host.
   */
  private handleCallActionRequests = (request: Message):void => {
    this.callLocalDeviceAction(request)
      .then((result: any) => {
        this.app.messenger.sendResponse(request, result);
      })
      .catch((error) => {
        this.app.messenger.sendResponse(request, null, error);
      });
  };

  private async callLocalDeviceAction(request: Message): Promise<any> {
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

  private resolveHost(deviceId: string): Destination {

    // TODO: !!!! посмотреть в конфиге на каком хосте находится девайс и вернуть адрес
    // TODO: !!!! резолвить master

    return {
      host: '',
      type: '',
      bus: '',
      address: '',
    };
  }

}
