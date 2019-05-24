import System from './System';
import {JsonTypes} from './interfaces/Types';
import {parseValue, splitTopicId} from './helpers/helpers';
import DeviceData from './interfaces/DeviceData';


// TODO: add call type
// TODO: add event
// TODO: add remoteCall


type ApiTypes = 'device' | 'event';

interface DeviceActionPayload {
  // room and device id
  deviceId: string;
  action: string;
  params: JsonTypes;
}

interface EmitEventPayload {
  category: string;
  topic?: string;
  data: any;
}

interface ApiMessage {
  type: ApiTypes;
  payload: DeviceActionPayload | EmitEventPayload;
}


export class Api {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  exec(cmd: string, data?: any): Promise<void> {
    const message: ApiMessage = this.parseCmd(cmd, data);

    if (message.type === 'device') {
      this.callDeviceAction(message.payload);
    }
    // TODO: add other types
  }

  subscribe(): number {
    const message: ApiMessage = this.parseCmd();
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


  private parseCmd(cmd: string, data?: any): ApiMessage {
    // TODO: add

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???


    // const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);
    //if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);
  }

}
