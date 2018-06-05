import * as _ from 'lodash';

import App from './App';
import Message from './interfaces/Message';
import { parseDeviceId, combineTopic, splitLastElement, topicSeparator } from '../helpers/helpers';


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

  /**
   * Call device's action and receive a response
   */
  callAction(deviceId: string, actionName: string, ...params: Array<any>): Promise<any> {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, actionName);

    return this.app.messenger.request(toHost, this.callActionCategory, topic, params);
  }

  /**
   * Set device's config.
   * You can set only changed parameters, you don't have to set all of them.
   */
  setConfig(deviceId: string, partialConfig: object) {
    return this.callAction(deviceId, 'setConfig', partialConfig);
  }

  /**
   * Listen to certain device's status
   */
  listenStatus(deviceId: string, status: string, handler: (value: any) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, this.statusTopic, status);

    // TODO: ??? зачем возвращается весь мessage если нежен только payload ???

    const callback = (message: Message) => {

      // TODO: если message.error? - нужно его возвращать поидее

      handler(message.payload);
    };

    this.app.messenger.subscribe(toHost, this.deviceFeedBackCategory, topic, callback);
  }

  /**
   * Listen to whole device's status
   */
  listenStatuses(deviceId: string, handler: (value: any) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, this.statusTopic);

    // TODO: test
    // TODO: ??? зачем возвращается весь мessage если нежен только payload ???

    const callback = (message: Message) => {

      // TODO: если message.error? - нужно его возвращать поидее

      handler(message.payload);
    };

    this.app.messenger.subscribe(toHost, this.deviceFeedBackCategory, topic, callback);
  }

  /**
   * Listen to changes of config or republishes of it.
   * It calls handler on each event with whole config.
   */
  listenConfig(deviceId: string, handler: (config: object) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, this.configTopic);

    // TODO: test
    // TODO: ??? зачем возвращается весь мessage если нежен только payload ???

    const callback = (message: Message) => {

      // TODO: если message.error? - нужно его возвращать поидее

      handler(message.payload);
    };

    this.app.messenger.subscribe(toHost, this.deviceFeedBackCategory, topic, callback);
  }

  /**
   * Publish change of device status.
   * It runs from local device itself.
   */
  publishStatus(deviceId: string, status: string, value: any): Promise<void> {

    // TODO: test
    // TODO: !!!! нужно публиковать как общий так и единичный статус, либо целый высчитывать

    const topic = combineTopic(deviceId, this.statusTopic, status);
    // send to local host
    const toHost: string = this.app.host.id;

    return this.app.messenger.publish(toHost, this.deviceFeedBackCategory, topic, value);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {
    const topic = combineTopic(deviceId, this.configTopic);
    // send to local host
    const toHost: string = this.app.host.id;

    // TODO: test

    return this.app.messenger.publish(toHost, this.deviceFeedBackCategory, topic, partialConfig);
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

    // TODO: получить конфиг девайса + манифест
    // TODO: проверить что actionName есть в манифесте

    const { rest: deviceId, last: actionName } = splitLastElement(request.topic, topicSeparator);

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
