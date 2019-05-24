import System from './System';
import {JsonTypes} from './interfaces/Types';
import {combineTopic, parseValue, splitTopicId} from './helpers/helpers';
import DeviceData from './interfaces/DeviceData';


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


export class Api {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  exec(topic: string, data?: string | Uint8Array): Promise<void> {
    const message: ApiMessage = this.parseCmd(topic, data);

    if (message.type === 'deviceIncome') {
      this.callDeviceAction(message.payload);
    }
    // TODO: add other types
  }

  subscribe(cb: (type: ApiTypes, topic: string, data?: string | Uint8Array) => void): number {
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
