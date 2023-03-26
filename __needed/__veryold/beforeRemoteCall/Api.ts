import System from './System';
import {JsonTypes} from './interfaces/Types';
import {combineTopic, parseValue, splitTopicId} from './helpers/helpers';
import IndexedEvents from './helpers/IndexedEvents';
import RemoteCall from './helpers/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {splitFirstElement} from './helpers/strings';
import {objGet} from './helpers/lodashLike';


export interface DeviceIncomePayload {
  // room and device id
  deviceId: string;
  action: string;
  params: JsonTypes[];
}

export interface DeviceStateOutcomePayload {
  // room and device id
  deviceId: string;
  // e.g status, status/temperature, config
  subTopic: string;
  data?: string | Uint8Array;
  // mark that it is status repeating or not
  isRepeat?: boolean;
}

// TODO: does it need ???
// interface EmitEventPayload {
//   category: string;
//   topic?: string;
//   data: any;
// }

export type ApiPayload = DeviceIncomePayload | DeviceStateOutcomePayload;
export type ApiTypes = 'deviceIncome' | 'deviceOutcome' | 'remoteCall';

type OutcomeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => void;
type RcOutcomeHandler = (message: RemoteCallMessage) => void;

export interface ApiMessage {
  type: ApiTypes;
  payload: ApiPayload;
}


/**
 * Api for acting remotely via ws or mqtt or others.
 * Types of topics:
 * * Calling device action:
 *   * device.room.deviceId/myAction value
 *   * room.deviceId/myAction value
 *
 * RemoteCall api:
 * * Call device's action - ('deviceAction', 'room.deviceId', 'turn', 'param1', 'param2')
 * * Listen to device's status - ('listenDeviceStatus', 'room.deviceId', 'temperature')
 * *            default status - ('listenDeviceStatus', 'room.deviceId')
 * * Listen to device's config - ('listenDeviceConfig', 'room.deviceId')
 * * Set device config - ('setDeviceConfig', 'room.deviceId', {... partial config})
 * * Getting config param - ('getConfig', 'config.ioSetResponseTimoutSec')
 * * Getting session store - ('getSessionStore', 'mySessionId', 'key')
 * * Getting state
 * * Subscribe to state change
 * * Initiate updating
 * * Switch automation
 */
export default class Api {
  private readonly system: System;
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  private readonly remoteCall: RemoteCall;


  constructor(system: System) {
    this.system = system;
    this.remoteCall = new RemoteCall(
      // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
      async (message: RemoteCallMessage) => this.rcOutcomeEvents.emit(message),
      this.callApi,
      this.system.config.config.ioSetResponseTimoutSec,
      this.system.log.error,
      this.system.generateUniqId
    );
  }

  destroy() {
    this.outcomeEvents.removeAll();
  }

  incomeRemoteCall(message: RemoteCallMessage): Promise<void> {
    return this.remoteCall.incomeMessage(message);
  }

  onOutcomeRemoteCall(cb: RcOutcomeHandler) {
    this.rcOutcomeEvents.addListener(cb);
  }



  /**
   * Call this method if external income request is received (e.g from remote host by mqtt or ws)
   */
  async income(topic: string, data?: string | Uint8Array) {
    this.system.log.info(`Api income: ${topic} - ${JSON.stringify(data)}`);

    const msg: ApiMessage = this.parseMessage(topic, data);

    switch (msg.type) {
      case 'deviceIncome':
        const payload = msg.payload as DeviceIncomePayload;

        return this.callDeviceAction(payload.deviceId, payload.action, ...payload.params);

      // TODO: add other types

      default:
        return this.system.log.error(`Api.income: Unsupported message type "${msg.type}"`);
    }
  }

  /**
   * Listen to outcome requests. E.g Which devices send to remote host.
   */
  onOutcome(cb: OutcomeHandler): number {
    return this.outcomeEvents.addListener(cb);
  }

  /**
   * Call this method if you want to send outcome data. (E.g after device state is changed)
   */
  emit(type: ApiTypes, apiPayload: ApiPayload) {
    switch (type) {
      case 'deviceOutcome':
        return this.emitDeviceOutcome(type, apiPayload as DeviceStateOutcomePayload);

      // TODO: add other types


      default:
        return this.system.log.error(`Api.emit: Unsupported message type "${type}"`);
    }
  }

  /**
   * Call device's action and receive a result
   */
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  getDevicesActionTopics(): string[] {
    const topics: string[] = [];
    const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();

    for (let deviceId of devicesIds) {
      const device = this.system.devicesManager.getDevice(deviceId);

      for (let actionName of device.getActionsList()) {
        const topic: string = combineTopic(this.system.systemConfig.topicSeparator, deviceId, actionName);

        topics.push(topic);
      }
    }

    return topics;
  }


  private emitDeviceOutcome(type: ApiTypes, payload: DeviceStateOutcomePayload) {
    const topic: string = combineTopic(
      this.system.systemConfig.topicSeparator,
      payload.deviceId,
      payload.subTopic
    );

    if (payload.isRepeat) {
      this.system.log.debug(`Api outcome (republish): ${topic} - ${JSON.stringify(payload.data)}`);
    }
    else {
      this.system.log.info(`Api outcome: ${topic} - ${JSON.stringify(payload.data)}`);
    }

    return this.outcomeEvents.emit(type, topic, payload.data);
  }

  private parseMessage(topic: string, data?: string | Uint8Array): ApiMessage {
    // TODO: add

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???


    // const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);
    //if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);
  }

  private async callApi(pathToMethod: string, args: any[]): Promise<any> {
    switch (pathToMethod) {
      case 'deviceAction':
        return this.callDeviceAction(args[0], args[1], ...args.slice(2));
      case 'listenDeviceStatus':
        // TODO: !!! ('listenDeviceStatus', 'room.deviceId', 'temperature')
      case 'listenDeviceConfig':
        // TODO: !!! ('listenDeviceConfig', 'room.deviceId')
      case 'setDeviceConfig':
        // TODO: !!! ('setDeviceConfig', 'room.deviceId', {... partial config})
      case 'getConfig':
        return objGet(this.system.config, args[0]);
      case 'getSessionStore':
        return this.system.sessions.getStorage(args[0], args[1]);
      default:

    }

    // TODO: add other types
    // Getting state
    // Subscribe to state change
    // Initiate updating
    // Switch automation
  }

}


// /**
//  * Get object like {deviceId: [actionName, ...]}
//  */
// getDevicesActions(): {[index: string]: string[]} {
//   // T-O-D-O: может перенсти в helpers ???
//   const result: {[index: string]: string[]} = {};
//   const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();
//
//   for (let devicesId of devicesIds) {
//     const device = this.system.devicesManager.getDevice(devicesId);
//
//     if (isEmpty((device as any).actions)) continue;
//
//     result[devicesId] = Object.keys((device as any).actions);
//   }
//
//   return result;
// }
