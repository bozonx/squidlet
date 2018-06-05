import * as _ from 'lodash';

import App from './App';
import Message from './interfaces/Message';
import { parseDeviceId } from '../helpers/helpers';


export default class DevicesDispatcher {
  private readonly app: App;
  private readonly callActionCategory: string = 'deviceCallAction';
  private readonly deviceFeedBackCategory: string = 'deviceFeedBack';
  private readonly statusTopic: string = 'status';
  private readonly configTopic: string = 'config';

  constructor(app) {
    this.app = app;
  }

  init(): void {
    // listen messages to call actions of local device
    this.app.messenger.listenIncomeRequests(this.callActionCategory, this.handleCallActionRequests);
  }

  callAction(deviceId: string, actionName: string, ...params: Array<any>): Promise<any> {

    // TODO: получить конфиг девайса + манифест
    // TODO: проверить что actionName есть в манифесте

    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = `${deviceId}/${actionName}`;

    return this.app.messenger.request(toHost, this.callActionCategory, topic, params);
  }

  /**
   * Listen for device's status messages.
   */
  listenStatus(deviceId: string, handler: (status: string, value: any) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);

    // TODO: подписываться либо на конкретный статус либо на все сразу

    const callback = (message: Message) => {

      // TODO: если message.error? - нужно его возвращать поидее

      handler(message.payload.status, message.payload.value);
    };

    // TODO: подписываться с учетом того что девайс может быть на удаленном хосте

    this.app.messenger.subscribe(toHost, this.deviceFeedBackCategory, this.statusTopic, callback);
  }

  listenConfig(deviceId: string, handler: (config: object) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);

    // TODO: test

    const callback = (message: Message) => {
      handler(message.payload.partialConfig);
    };

    this.app.messenger.subscribe(toHost, this.deviceFeedBackCategory, this.configTopic, callback);
  }

  setConfig(deviceId: string, partialConfig: object) {

    // TODO: test

    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = `${deviceId}/setConfig`;

    return this.app.messenger.request(toHost, this.callActionCategory, topic, partialConfig);
  }

  /**
   * It runs from local device itself to publish its status changes.
   */
  publishStatus(deviceId: string, status: string, value: any): Promise<void> {

    // TODO: test

    // TODO: !!!! нужно просто поднять всех подписчиков - отправить локально но на спец категорию

    const payload = {
      status,
      value,
    };

    return this.app.messenger.publish(undefined, this.deviceFeedBackCategory, this.statusTopic, payload);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {

    // TODO: test

    // TODO: !!!! нужно просто поднять всех подписчиков - отправить локально но на спец категорию

    const payload = {
      partialConfig,
    };

    return this.app.messenger.publish(undefined, this.deviceFeedBackCategory, this.configTopic, payload);
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

  private resolveDestinationHost(deviceId: string): string {
    const { hostId } = parseDeviceId(deviceId);

    return hostId;
  }

}
