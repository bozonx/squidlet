import {splitFirstElement} from 'system/lib/strings';
import {combineTopic, parseValue} from 'system/lib/helpers';
import {Dictionary, JsonTypes} from 'system/interfaces/Types';
import {trim} from 'system/lib/lodashLike';
import System from 'system/System';
import {StateCategories} from 'system/interfaces/States';
import IndexedEvents from 'system/lib/IndexedEvents';
import {DEFAULT_STATUS} from 'system/baseDevice/DeviceBase';


export type TopicType = 'device' | 'api';
type DeviceStateType = 'status' | 'config';
type OutcomeHandler = (topic: string, data: string) => void;

const topicTypes = ['device', 'api'];
export const TOPIC_TYPE_SEPARATOR = '|';
export const TOPIC_SEPARATOR = '/';


/**
 * Types of topics
 * device - means call device action
 * api - call specific api
 * * publishWholeState - publish while device etc states
 * * blockIo true|false
 */
export default class ApiTopicsLogic {
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  init() {
    // listen to outcome messages from api and send them to mqtt broker
    this.system.state.onChange(this.handleStateChange);
  }

  destroy() {
    this.outcomeEvents.removeAll();
  }


  /**
   * Call this when you have received an income message
   */
  incomeMessage = async (fullTopic: string, data: string) => {
    const [topicType, body] = this.parseTopic(fullTopic);

    switch (topicType) {
      case 'device':
        const [deviceId, actionName] = splitFirstElement(body, TOPIC_SEPARATOR);

        await this.callDeviceAction(deviceId, actionName, data);
        break;
      case 'api':
        await this.callApi(body, data);
        break;
    }
  }

  /**
   * Listen messages which are sent outcome from this host.
   */
  onOutcome(cb: OutcomeHandler): number {
    return this.outcomeEvents.addListener(cb);
  }

  removeOutcomeListener(handlerIndex: number) {
    this.outcomeEvents.removeListener(handlerIndex);
  }

  isSupportedTopic(topic: string): boolean {
    const splat = splitFirstElement(topic, TOPIC_TYPE_SEPARATOR);

    return topicTypes.includes(splat[0]);
  }


  private handleStateChange = (category: number, stateName: string, changedParams: string[]) => {
    try {
      // send outcome all the devices status and config changes
      if (category === StateCategories.devicesStatus) {
        this.publishDeviceState('status', category, stateName, changedParams);
      }
      else if (category === StateCategories.devicesConfig) {
        this.publishDeviceState('config', category, stateName, changedParams);
      }
    }
    catch (err) {
      this.system.log.error(`Can't publish device state: ${err}`);
    }
  }

  private async callApi(methodName: string, data: string) {
    const args: JsonTypes[] = this.parseArgs(data);

    switch (methodName) {
      case 'publishWholeState':
        await this.publishWholeState();
        break;
      // case 'blockIo':
      //   await this.system.api.blockIo(args[0] as boolean);
      //   break;
    }
  }

  private async callDeviceAction(deviceId: string, actionName?: string, data?: string) {
    if (!actionName) {
      throw new Error(`MqttApi.callDeviceAction: no actionName: "${deviceId}"`);
    }

    // income string-type api message - call device action
    this.system.log.info(`ApiTopics income action call of device ${deviceId}${TOPIC_SEPARATOR}${actionName}: ${JSON.stringify(data)}`);

    const args: JsonTypes[] = this.parseArgs(data);

    await this.system.api.callDeviceAction(deviceId, actionName, ...args);
  }

  private parseArgs(data: string | undefined): JsonTypes[] {
    if (typeof data === 'undefined') {
      return [];
    }
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

  /**
   * Parse topic to topicType and topicBody.
   */
  private parseTopic(topic: string): [TopicType, string] {
    const splat = splitFirstElement(topic, TOPIC_TYPE_SEPARATOR);

    if (!topicTypes.includes(splat[0])) {
      throw new Error(`Invalid topic "${topic}": unknown type`);
    }
    else if (!splat[1]) {
      throw new Error(`Invalid topic "${topic}": Doesn't have the body`);
    }

    return [
      splat[0] as TopicType,
      splat[1],
    ];
  }

  private publishDeviceState(
    stateType: DeviceStateType,
    category: number,
    stateName: string,
    changedParams: string[]
  ) {
    const topicType: TopicType = 'device';
    const state: Dictionary | undefined = this.system.state.getState(category, stateName);

    if (!state) return;

    for (let paramName of changedParams) {
      const resolvedParamName: string | undefined = (paramName === DEFAULT_STATUS) ? undefined : paramName;
      const topicBody = combineTopic(TOPIC_SEPARATOR, stateName, stateType, resolvedParamName);
      const data: string = JSON.stringify(state[paramName]);

      this.emitOutcomeMsg(topicType, topicBody, data);
    }
  }

  private emitOutcomeMsg(topicType: TopicType, topicBody: string, data: string) {
    const topic = combineTopic(TOPIC_TYPE_SEPARATOR, topicType, topicBody);

    this.system.log.info(`MqttApi outcome: ${topic} - ${JSON.stringify(data)}`);
    this.outcomeEvents.emit(topic, data);
  }

  private publishWholeState() {
    // TODO: publish all the states of all the devices etc
  }

}