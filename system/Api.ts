import System from './System';
import {JsonTypes} from './interfaces/Types';
import {combineTopic, parseValue, splitTopicId} from './helpers/helpers';
import IndexedEvents from './helpers/IndexedEvents';
import categories from './dict/categories';
import PublishParams from './interfaces/PublishParams';


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

export interface DeviceOutcomePayload {
  // room and device id
  deviceId: string;
  // e.g status, status/temperature, config
  subTopic: string;
  data: JsonTypes;
  // TODO: может просто isRepeat ????
  params?: PublishParams;
}

interface EmitEventPayload {
  category: string;
  topic?: string;
  data: any;
}

export type ApiPayload = DeviceIncomePayload | DeviceOutcomePayload | EmitEventPayload;
export type ApiTypes = 'deviceIncome' | 'deviceOutcome' | 'event';
type OutcomeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => void;
export type IncomeHandler = (type: ApiTypes, payload: ApiPayload) => void;

export interface ApiMessage {
  type: ApiTypes;
  payload: ApiPayload;
}


// TODO: remove
let lastId: number = 0;


export default class Api {
  private readonly system: System;
  // TODO: может лучше использовать общие события ????
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  private readonly incomeEvents = new IndexedEvents<IncomeHandler>();


  constructor(system: System) {
    this.system = system;
    //this.system.events.addCategoryListener(categories.externalDataOutcome, this.externalOutcomeHandler);
  }

  destroy() {
    this.outcomeEvents.removeAll();
  }


  /**
   * Generate unique id.
   * It places here for easy testing and mocking.
   */
  generateUniqId(): string {
    // TODO: make - system id + timestamp + index
    // TODO: может перенести в system???

    lastId++;

    return String(lastId);
  }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  getDevicesActionTopics(): string[] {
    // TODO: может перенсти в helpers or system или devices manager???

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

  /**
   * Call this method if external income request is received (e.g from remote host by mqtt or ws)
   */
  async income(topic: string, data?: string | Uint8Array) {
    this.system.log.info(`Api income: ${topic} - ${JSON.stringify(data)}`);

    const msg: ApiMessage = this.parseCmd(topic, data);

    // TODO: в самом девайсе можно не слушать api.onIncome - а вызов action делать в api

    this.incomeEvents.emit(msg.type, msg.payload);

    // switch (msg.type) {
    //   case 'deviceIncome':
    //     const payload = msg.payload as DeviceIncomePayload;
    //
    //     return this.callDeviceAction(payload.deviceId, payload.action, ...payload.params);
    //
    //   // TODO: add other types
    //
    //
    //   default:
    //     this.system.log.error(`Api.income: Unsupported message type "${msg.type}"`);
    // }
  }

  /**
   * Listen to outcome requests. E.g Which devices send to remote host.
   */
  onOutcome(cb: OutcomeHandler): number {
    return this.outcomeEvents.addListener(cb);
  }

  onIncome(cb: IncomeHandler): number {
    return this.incomeEvents.addListener(cb);
    //this.env.events.addListener(categories.externalDataIncome, this.id, this.handleIncomeData);
  }

  /**
   * Call this method if you want to send outcome data. (E.g after device state is changed)
   */
  emit(type: ApiTypes, payload: ApiPayload) {

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
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<any> {
    // TODO: вызвать напрямую без события
    // const incomeData: DeviceData = {
    //   id,
    //   subTopic,
    //   // TODO: а если json ????
    //   // parse number, boolean etc
    //   data: parseValue(data),
    // };

    //this.system.events.emit(categories.externalDataIncome, id, incomeData);
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
