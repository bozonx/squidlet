import {splitFirstElement} from './helpers/strings';
import {combineTopic, parseValue} from './helpers/helpers';
import {JsonTypes} from './interfaces/Types';
import {trim} from './helpers/lodashLike';
import System from './System';
import {StateCategories} from './interfaces/States';

type TopicType = 'device' | 'api';

const topicTypes = ['device', 'api'];
const TOPIC_TYPE_SEPARATOR = '|';
export const TOPIC_SEPARATOR = '/';


/**
 * Types of topics
 * device - means call device action
 * api - call specific api
 * * publishWholeState - publish while device etc states
 * * blockIo true|false
 */
export default class ApiTopics {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  init() {
    // this.env.api.onPublish((topic: string, data: JsonTypes, isRepeat?: boolean) => {
    //   this.publishHandler(topic, data, isRepeat)
    //     .catch(this.env.log.error);
    // });

    // listen to outcome messages from api and send them to mqtt broker
    this.system.state.onChange(this.handlerStateChange);
  }


  publishWholeState() {
    // TODO: publish all the states of all the devices etc
  }

  async incomeMessage(topic: string, data: string | Uint8Array) {
    const [topicType, body] = this.parseTopic(topic);

    switch (topicType) {
      case 'device':
        await this.callDeviceAction(body, data);
        break;
      case 'api':
        await this.callApi(body, data);
        break;
    }
  }

  onOutcome(cb: (topic: string, data: string | Uint8Array) => void) {
    // TODO: !!!!

    this.env.log.info(`MqttApi outcome: ${topic} - ${JSON.stringify(data)}`);
  }

  // run(topicType: TopicType, topicBody: string, data: string | Uint8Array) {
  //   const topic: string = combineTopic(TOPIC_TYPE_SEPARATOR, topicType, topicBody);
  // }

  private handlerStateChange = (category: number, stateName: string, changedParams: string[]) => {
    if (category === StateCategories.devicesStatus) {
      // TODO: publish to mqtt
    }
    else if (category === StateCategories.devicesConfig) {
      // TODO: publish to mqtt
    }
  }

  private async callApi(methodName: string, data: string | Uint8Array) {
    const args: JsonTypes[] = this.parseArgs(data);

    switch (methodName) {
      case 'publishWholeState':
        await this.publishWholeState();
        break;
      case 'blockIo':
        await this.system.api.blockIo(args[0] as boolean);
        break;
    }
  }

  private async callDeviceAction(topic: string, data: string | Uint8Array) {
    // income string-type api message - call device action
    this.system.log.info(`ApiTopics income device action call: ${topic} ${JSON.stringify(data)}`);

    const args: JsonTypes[] = this.parseArgs(data);
    const [deviceId, actionName] = splitFirstElement(topic, TOPIC_SEPARATOR);

    if (!actionName) {
      throw new Error(`MqttApi.callDeviceAction: Not actionName: "${topic}"`);
    }

    await this.system.api.callDeviceAction(deviceId, actionName, args);
  }

  private parseArgs(data: any): JsonTypes[] {
    if (typeof data === 'undefined') return [];
    else if (typeof data !== 'string') {
      throw new Error(`Invalid data, it has to be a string. "${JSON.stringify(data)}"`);
    }

    const splat: string[] = data.split(',');
    const result: JsonTypes[] = [];

    for (let item of splat) {
      result.push( parseValue(trim(item)) );
    }

    return result;
  }

  private parseTopic(topic: string): [TopicType, string] {
    const splat = splitFirstElement(TOPIC_TYPE_SEPARATOR, topic);

    if (!topicTypes.includes(splat[0])) {
      throw new Error(`Invalid topic "${topic}": unknown type`);
    }
    else if (!splat[1]) {
      throw new Error(`Invalid topic "${topic}": no body`);
    }

    return [
      splat[0] as TopicType,
      splat[1],
    ];
  }

}
