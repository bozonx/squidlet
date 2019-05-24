import System from './System';
import {JsonTypes} from './interfaces/Types';
import {combineTopic, parseValue, splitTopicId} from './helpers/helpers';
import DeviceData from './interfaces/DeviceData';
import {isEmpty} from './helpers/lodashLike';


// TODO: add call type
// TODO: add event
// TODO: add remoteCall


export type ApiTypes = 'deviceIncome' | 'deviceOutcome' | 'event';

interface DeviceIncomePayload {
  // room and device id
  deviceId: string;
  action: string;
  params: JsonTypes;
}

export interface DeviceOutcomePayload {
  // room and device id
  deviceId: string;
  // e.g status, status/temperature, config
  subTopic: string;
  data: JsonTypes;
}

interface EmitEventPayload {
  category: string;
  topic?: string;
  data: any;
}

export interface ApiMessage {
  type: ApiTypes;
  payload: DeviceIncomePayload | DeviceOutcomePayload | EmitEventPayload;
}


// TODO: remove
let lastId: number = 0;


export default class Api {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  income(topic: string, data?: string | Uint8Array): Promise<void> {
    //this.env.log.info(`MQTT income: ${topic} - ${data}`);

    const message: ApiMessage = this.parseCmd(topic, data);

    if (message.type === 'deviceIncome') {
      this.callDeviceAction(message.payload);
    }
    // TODO: add other types
  }

  onOutcome(cb: (type: ApiTypes, topic: string, data?: string | Uint8Array) => void): number {
    const message: ApiMessage = this.parseCmd();

    //this.env.events.addCategoryListener(categories.externalDataOutcome, this.externalOutcomeHandler);

    //const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, data.id, data.subTopic);


    // if (data.params && data.params.isRepeat) {
    //   this.env.log.debug(`MQTT outcome (republish): ${topic} - ${JSON.stringify(data.data)}`);
    // }
    // else {
    //   this.env.log.info(`MQTT outcome: ${topic} - ${JSON.stringify(data.data)}`);
    // }

  }

  /**
   * Generate unique id.
   * It places here for easy testing and mocking.
   */
  generateUniqId(): string {
    // TODO: make - system id + timestamp + index

    lastId++;

    return String(lastId);
  }

  /**
   * Get object like {deviceId: [actionName, ...]}
   */
  getDevicesActions(): {[index: string]: string[]} {
    const result: {[index: string]: string[]} = {};
    const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();

    for (let devicesId of devicesIds) {
      const device = this.system.devicesManager.getDevice(devicesId);

      // TODO: review

      if (isEmpty((device as any).actions)) continue;

      result[devicesId] = Object.keys((device as any).actions);
    }

    return result;
  }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  getDevicesActionTopics(): string[] {
    for (let deviceId of Object.keys(devicesActions)) {
      for (let action of devicesActions[deviceId]) {
        const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, deviceId, action);

        this.env.log.info(`MQTT subscribe: ${topic}`);

        // TODO: обработать ошибку промиса

        this.subscribe(topic)
          .catch(this.env.log.error);
      }
    }


    const result: {[index: string]: string[]} = {};
    const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();

    for (let devicesId of devicesIds) {
      const device = this.system.devicesManager.getDevice(devicesId);

      // TODO: review

      if (isEmpty((device as any).actions)) continue;

      result[devicesId] = Object.keys((device as any).actions);
    }

    return result;
  }

  /**
   * Call device's action and receive a result
   */
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<any> {
    // TODO: add
    const incomeData: DeviceData = {
      id,
      subTopic,
      // TODO: а если json ????
      // parse number, boolean etc
      data: parseValue(data),
    };

    this.system.events.emit(categories.externalDataIncome, id, incomeData);
  }

  setDeviceConfig(deviceId: string, partialConfig: {[index: string]: any}): Promise<void> {
    // TODO: add
  }

  listenDeviceStatus(): number {
    // TODO: add
  }

  listenDeviceConfig(): number {
    // TODO: add
  }


  private parseCmd(topic: string, data?: any): ApiMessage {
    // TODO: add

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???


    // const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);
    //if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);
  }

}
