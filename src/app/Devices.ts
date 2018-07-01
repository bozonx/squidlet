import * as _ from 'lodash';

import System from './System';
import Message from '../messenger/interfaces/Message';
import Request from '../messenger/interfaces/Request';

import { parseDeviceId, combineTopic, splitLastElement, topicSeparator } from '../helpers/helpers';


const CALL_ACTION_CATEGORY = 'deviceCallAction';
const DEVICE_FEEDBACK_CATEGORY = 'deviceFeedBack';
const STATUS_TOPIC = 'status';
const CONFIG_TOPIC = 'config';


export default class Devices {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  init(): void {
    // listen messages to call actions of local device
    this.system.events.addListener(CALL_ACTION_CATEGORY, undefined, this.handleCallActionRequests);
  }

  /**
   * Call device's action and receive a response
   */
  callAction(deviceId: string, actionName: string, ...params: Array<any>): Promise<any> {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, actionName);

    return this.system.messenger.request(toHost, CALL_ACTION_CATEGORY, topic, params);
  }

  /**
   * Set device's config.
   * You can set only changed parameters, you don't have to set all of them.
   */
  setConfig(deviceId: string, partialConfig: object): Promise<any> {
    return this.callAction(deviceId, 'setConfig', partialConfig);
  }

  /**
   * Listen to certain device's status
   */
  listenStatus(deviceId: string, statusName: string, handler: (value: any) => void): void {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, STATUS_TOPIC, statusName);

    this.system.messenger.subscribe(toHost, DEVICE_FEEDBACK_CATEGORY, topic, handler);
  }

  /**
   * Listen to whole device's status
   */
  listenStatuses(deviceId: string, handler: (value: any) => void): void {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, STATUS_TOPIC);

    this.system.messenger.subscribe(toHost, DEVICE_FEEDBACK_CATEGORY, topic, handler);
  }

  /**
   * Listen to changes of config or republishes of it.
   * It calls handler on each event with whole config.
   */
  listenConfig(deviceId: string, handler: (config: object) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const topic = combineTopic(deviceId, CONFIG_TOPIC);

    this.system.messenger.subscribe(toHost, DEVICE_FEEDBACK_CATEGORY, topic, handler);
  }

  /**
   * Publish change of device status.
   * It runs from local device itself.
   */
  publishStatus(deviceId: string, status: string, value: any): Promise<void> {

    // TODO: !!!! нужно публиковать как общий так и единичный статус, либо целый высчитывать

    const topic = combineTopic(deviceId, STATUS_TOPIC, status);
    // send to local host
    const toHost: string = this.system.host.id;

    return this.system.messenger.publish(toHost, DEVICE_FEEDBACK_CATEGORY, topic, value);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {
    const topic = combineTopic(deviceId, CONFIG_TOPIC);
    // send to local host
    const toHost: string = this.system.host.id;

    // TODO: test

    return this.system.messenger.publish(toHost, DEVICE_FEEDBACK_CATEGORY, topic, partialConfig);
  }


  /**
   * Listen for actions which have to be called on current host.
   */
  private handleCallActionRequests = (request: Request): void => {

    // TODO: review
    // TODO: если нет заданного action  - вернуть ошибку

    if (_.isUndefined(request.isResponse) || request.isResponse) return;

    this.callLocalDeviceAction(request)
      .then((result: any) => {
        this.system.messenger.sendResponse(request, result);
      })
      .catch((error) => {
        this.system.messenger.sendResponse(request, null, error);
      });
  }

  private async callLocalDeviceAction(request: Request): Promise<any> {

    // TODO: получить конфиг девайса + манифест
    // TODO: проверить что actionName есть в манифесте

    const { rest, last: actionName } = splitLastElement(request.topic, topicSeparator);

    if (!rest) throw new Error(`Can't parse deviceId`);

    const deviceId = rest || '';

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

    const device: {[inde: string]: any} = this.system.devicesManager.getDevice(deviceId);
    const result = await device[actionName](...request.payload);

    return result;
  }

  private resolveDestinationHost(deviceId: string): string {
    const { hostId } = parseDeviceId(deviceId);

    return hostId;
  }

}
