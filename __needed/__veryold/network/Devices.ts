import System from '../../system/System';
import Request from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Request';
import Response from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Response';
import Message from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';


const CALL_ACTION_TOPIC = 'deviceCallAction';
const DEVICE_FEEDBACK_TOPIC = 'deviceFeedBack';
const STATUS_ACTION = 'status';
const CONFIG_ACTION = 'config';

interface Payload {
  deviceId: string;
  actionName: string;
}

interface CallActionPayload extends Payload {
  // params for device's method
  params: Array<any>;
}

interface StatusPayload extends Payload {
  actionName: 'status';
  statusName: string;
  value: any;
}

interface ConfigPayload extends Payload {
  actionName: 'config';
  config: {[idnex: string]: any};
}


export default class Devices {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  init(): void {
    // listen messages to call actions of local device
    this.system.messenger.listenRequests(CALL_ACTION_TOPIC, this.handleCallActionRequests);
  }

  /**
   * Call device's action and receive a response
   */
  callAction(deviceId: string, actionName: string, ...params: Array<any>): Promise<Response> {
    const toHost: string = this.system.host.resolveHostIdByEntityId(deviceId);
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
   * Handler have to be a new function each time.
   */
  listenStatus(deviceId: string, statusName: string, handler: (value: any) => void): string {
    const toHost: string = this.system.host.resolveHostIdByEntityId(deviceId);
    const wrapper = (message: Message) => {
      const payload: StatusPayload = message.payload;

      // TODO: куда девается ошибка ???? разве ее не нужно получать и передавать дальше???

      if (
        payload.deviceId !== deviceId
        || payload.actionName !== STATUS_ACTION
        || payload.statusName !== statusName
      ) return;

      handler(payload.value);
    };

    //combineTopic(deviceId, 'status', statusName)

    return this.system.messenger.subscribe(toHost, categories.devicesChannel, DEVICE_FEEDBACK_TOPIC, wrapper);
  }

  /**
   * Listen to changes of config or republishes of it.
   * It calls handler on each event with whole config.
   * Handler have to be a new function each time.
   */
  listenConfig(deviceId: string, handler: (config: {[index: string]: any}) => void): string {
    const toHost: string = this.system.host.resolveHostIdByEntityId(deviceId);
    const wrapper = (message: Message) => {
      const payload: ConfigPayload = message.payload;

      // TODO: куда девается ошибка ???? разве ее не нужно получать и передавать дальше???

      if (payload.deviceId !== deviceId || payload.actionName !== CONFIG_ACTION) return;

      handler(payload.config);
    };

    return this.system.messenger.subscribe(toHost, categories.devicesChannel, DEVICE_FEEDBACK_TOPIC, wrapper);
  }

  removeListener(handlerId: string): void {

    // TODO: use deviceId and action as eventName
    // TODO: run unsubscribe ???

  }

  /**
   * Publish change of device status.
   * It runs from local device itself.
   */
  publishStatus(deviceId: string, statusName: string, value: any): Promise<void> {
    // send to local host
    const toHost: string = this.system.host.id;
    const payload: StatusPayload = {
      deviceId,
      actionName: STATUS_ACTION,
      statusName,
      value,
    };

    return this.system.messenger.send(toHost, categories.devicesChannel, DEVICE_FEEDBACK_TOPIC, payload);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {
    // send to local host
    const toHost: string = this.system.host.id;
    const payload: ConfigPayload = {
      deviceId,
      actionName: CONFIG_ACTION,
      config: partialConfig,
    };

    return this.system.messenger.send(toHost, categories.devicesChannel, DEVICE_FEEDBACK_TOPIC, payload);
  }


  /**
   * Listen for actions which have to be called on current host.
   */
  private handleCallActionRequests = (request: Request): void => {
    // handle only requests
    if (!request.isRequest || !request.payload || !request.payload.deviceId || !request.payload.params) return;

    this.callLocalDeviceAction(request)
      .then((result: any) => {

        // TODO: что делать в случае ошибки???

        this.system.messenger.response(request, undefined, 0, result);
      })
      .catch((error) => {
        this.system.messenger.response(request, error, 2);
      });
  }

  private async callLocalDeviceAction(request: Request): Promise<any> {
    this.checkCallActionPayload(request.payload, request);

    const payload: CallActionPayload = request.payload;
    const deviceId = payload.deviceId;
    const device: {[index: string]: any} = this.system.devicesManager.getDevice(deviceId);

    if (!device.actions[payload.actionName]) {
      throw new Error(`Device "${deviceId}" doesn't have an action ${payload.actionName}`);
    }

    const result = await device.action(payload.actionName, ...request.payload.params);

    return result;
  }

  private checkCallActionPayload(payload: CallActionPayload, request: Request): void {
    if (!payload.deviceId) {
      throw new Error(`There isn't deviceId param in payload of Request ${JSON.stringify(request)}`);
    }

    if (!Array.isArray(payload.params)) {
      throw new Error(`
        Payload of calling action has to be an array.
        Request: ${JSON.stringify(request)}
      `);
    }

    if (!payload.actionName) {
      throw new Error(`
        You have to specify an actionName like this: { topic: deviceId/actionName } .
        Request: ${JSON.stringify(request)}
      `);
    }
  }

}
