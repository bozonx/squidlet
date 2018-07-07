import * as _ from 'lodash';

import System from './System';
import Request from '../messenger/interfaces/Request';

import { parseDeviceId, combineTopic, splitLastElement, topicSeparator } from '../helpers/helpers';
import Response from '../messenger/interfaces/Response';
import {REQUEST_CATEGORY} from '../messenger/Messenger';


const CALL_ACTION_TOPIC = 'deviceCallAction';
const DEVICE_FEEDBACK_TOPIC = 'deviceFeedBack';
const STATUS_TOPIC = 'status';
const STATUS_ACTION = 'status';
const CONFIG_TOPIC = 'config';
const CONFIG_ACTION = 'config';


interface CallActionPayload {
  deviceId: string;
  actionName: string;
  // params for device's method
  params: Array<any>;
}

interface StatusPayload {
  deviceId: string;
  actionName: 'status';
  statusName: string;
  value: any;
}

interface ConfigPayload {
  deviceId: string;
  actionName: 'config';
  config: {[idnex: string]: any};
}


export default class Devices {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  init(): void {
    // TODO: наверное лучше слушать через messenger
    // listen messages to call actions of local device
    this.system.events.addListener(REQUEST_CATEGORY, CALL_ACTION_TOPIC, this.handleCallActionRequests);
  }

  /**
   * Call device's action and receive a response
   */
  callAction(deviceId: string, actionName: string, ...params: Array<any>): Promise<Response> {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const payload: CallActionPayload = {
      deviceId,
      actionName,
      params,
    };

    return this.system.messenger.request(toHost, CALL_ACTION_TOPIC, payload);
  }

  /**
   * Set device's config.
   * You can set only changed parameters, you don't have to set all of them.
   */
  setConfig(deviceId: string, partialConfig: {[index: string]: any}): Promise<any> {
    return this.callAction(deviceId, 'setConfig', partialConfig);
  }

  /**
   * Listen to certain device's status.
   * To listed default status use 'default' as statusName.
   */
  listenStatus(deviceId: string, statusName: string, handler: (value: any) => void): void {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const cb = (payload: StatusPayload) => {
      if (
        payload.deviceId !== deviceId
        || payload.actionName !== STATUS_ACTION
        || payload.statusName !== statusName
      ) return;

      handler(payload.value);
    };

    this.system.messenger.subscribe(toHost, DEVICE_FEEDBACK_TOPIC, cb);
  }

  // TODO: add removeListener - status or config

  /**
   * Listen to changes of config or republishes of it.
   * It calls handler on each event with whole config.
   */
  listenConfig(deviceId: string, handler: (config: {[index: string]: any}) => void) {
    const toHost: string = this.resolveDestinationHost(deviceId);
    const cb = (payload: ConfigPayload) => {
      if (payload.deviceId !== deviceId || payload.actionName !== CONFIG_ACTION) return;

      handler(payload.config);
    };

    this.system.messenger.subscribe(toHost, DEVICE_FEEDBACK_TOPIC, cb);
  }

  /**
   * Publish change of device status.
   * It runs from local device itself.
   */
  publishStatus(deviceId: string, statusName: string, value: any): Promise<void> {
    const topic = combineTopic(deviceId, STATUS_TOPIC, statusName);
    // send to local host
    const toHost: string = this.system.host.id;

    return this.system.messenger.publish(toHost, DEVICE_FEEDBACK_TOPIC, topic, value);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {
    const topic = combineTopic(deviceId, CONFIG_TOPIC);
    // send to local host
    const toHost: string = this.system.host.id;

    return this.system.messenger.publish(toHost, DEVICE_FEEDBACK_TOPIC, topic, partialConfig);
  }


  /**
   * Listen for actions which have to be called on current host.
   */
  private handleCallActionRequests = (request: Request): void => {
    // handle only requests
    if (!request.isRequest) return;

    this.callLocalDeviceAction(request)
      .then((result: any) => {
        this.system.messenger.response(request, undefined, 0, result);
      })
      .catch((error) => {
        this.system.messenger.response(request, error, 2);
      });
  }

  private async callLocalDeviceAction(request: Request): Promise<any> {
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

    if (!device[actionName]) {
      throw new Error(`Device "${deviceId}" doesn't have an action ${actionName}`);
    }

    const result = await device[actionName](...request.payload);

    return result;
  }

  private resolveDestinationHost(deviceId: string): string {
    const { hostId } = parseDeviceId(deviceId);

    return hostId;
  }

}
