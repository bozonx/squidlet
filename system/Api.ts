import System from './System';
import {JsonTypes} from './interfaces/Types';
import {combineTopic, parseValue, splitTopicId} from './helpers/helpers';
import IndexedEvents from './helpers/IndexedEvents';


// TODO: add call type
// TODO: add event
// TODO: add remoteCall
// TODO: порреджка переключения automation


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

interface EmitEventPayload {
  category: string;
  topic?: string;
  data: any;
}

export type ApiPayload = DeviceIncomePayload | DeviceStateOutcomePayload | EmitEventPayload;
export type ApiTypes = 'deviceIncome' | 'deviceOutcome' | 'event';
type OutcomeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => void;
//export type IncomeHandler = (type: ApiTypes, payload: ApiPayload) => void;

export interface ApiMessage {
  type: ApiTypes;
  payload: ApiPayload;
}


export default class Api {
  private readonly system: System;
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  //private readonly incomeEvents = new IndexedEvents<IncomeHandler>();


  constructor(system: System) {
    this.system = system;
  }

  destroy() {
    this.outcomeEvents.removeAll();
  }


  /**
   * Call this method if external income request is received (e.g from remote host by mqtt or ws)
   */
  async income(topic: string, data?: string | Uint8Array) {
    this.system.log.info(`Api income: ${topic} - ${JSON.stringify(data)}`);

    const msg: ApiMessage = this.parseCmd(topic, data);

    //this.incomeEvents.emit(msg.type, msg.payload);

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

  // onIncome(cb: IncomeHandler): number {
  //   return this.incomeEvents.addListener(cb);
  //   //this.env.events.addListener(categories.externalDataIncome, this.id, this.handleIncomeData);
  // }

  /**
   * Call this method if you want to send outcome data. (E.g after device state is changed)
   */
  emit(type: ApiTypes, apiPayload: ApiPayload) {
    switch (type) {
      case 'deviceOutcome':
        const payload = apiPayload as DeviceStateOutcomePayload;
        const topic: string = combineTopic(
          this.system.systemConfig.topicSeparator,
          payload.deviceId,
          payload.subTopic
        );

        return this.outcomeEvents.emit(type, topic, payload.data);

      // TODO: add other types


      default:
        return this.system.log.error(`Api.emit: Unsupported message type "${type}"`);
    }

    // TODO: emit event
    // TODO: log to console

    //const message: ApiMessage = this.parseCmd();

    //

    //const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, data.id, data.subTopic);


    // if (data.params && data.params.isRepeat) {
    //   this.env.log.debug(`MQTT outcome (republish): ${topic} - ${JSON.stringify(data.data)}`);
    // }
    // else {
    //   this.env.log.info(`MQTT outcome: ${topic} - ${JSON.stringify(data.data)}`);
    // }

  }

  /**
   * Call device's action and receive a result
   */
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }

  switchAutomation(toState: boolean): Promise<void> {
    // TODO: turn on or off automation
  }

  setDeviceConfig(deviceId: string, partialConfig: {[index: string]: any}): Promise<void> {
    // TODO: add
  }

  // listenDeviceStatus(): number {
  // }
  //
  // listenDeviceConfig(): number {
  // }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  getDevicesActionTopics(): string[] {
    // TODO: может перенсти в system или devices manager???

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


  private parseCmd(topic: string, data?: any): ApiMessage {
    // TODO: add

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???


    // const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);
    //if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);
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
