import {splitFirstElement} from './helpers/strings';
import {combineTopic, parseValue} from './helpers/helpers';
import {JsonTypes} from './interfaces/Types';
import {trim} from './helpers/lodashLike';
import System from './System';
import {StateCategories} from './interfaces/States';
import IndexedEvents from './helpers/IndexedEvents';

type TopicType = 'device' | 'api';
type OutcomeHandler = (topic: string, data: string) => void;

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
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  init() {
    // listen to outcome messages from api and send them to mqtt broker
    this.system.state.onChange(this.handlerStateChange);
  }

  destroy() {
    this.outcomeEvents.removeAll();
  }


  publishWholeState() {
    // TODO: publish all the states of all the devices etc
  }

  incomeMessage = async (topic: string, data: string) => {
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

  onOutcome(cb: OutcomeHandler): number {
    return this.outcomeEvents.addListener(cb);
  }

  removeOutcomeListener(handlerIndex: number) {
    this.outcomeEvents.removeListener(handlerIndex);
  }

  private handlerStateChange = (category: number, stateName: string, changedParams: string[]) => {
    let topic: string;
    let data: string;

    if (category === StateCategories.devicesStatus) {
      // TODO: prepare and call outcomeEvents.emit


      const dataToSend: string = JSON.stringify(data);

    }
    else if (category === StateCategories.devicesConfig) {
      // TODO: prepare and call outcomeEvents.emit


    }

    this.system.log.info(`MqttApi outcome: ${topic} - ${JSON.stringify(data)}`);
    this.outcomeEvents.emit(topic, data);
  }

  private async callApi(methodName: string, data: string) {
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

  private async callDeviceAction(topic: string, data: string) {
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
