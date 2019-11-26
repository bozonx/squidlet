import {splitFirstElement} from 'system/lib/strings';
import {combineTopic, parseArgs} from 'system/lib/helpers';
import {Dictionary, JsonTypes} from 'system/interfaces/Types';
import {StateCategories} from 'system/interfaces/States';
import IndexedEvents from 'system/lib/IndexedEvents';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';
import Context from 'system/Context';


export type TopicType = 'device' | 'api';
type DeviceStateType = 'status' | 'config';
type OutcomeHandler = (topic: string, data: string) => void;

const topicTypes = ['device', 'api'];
const allowedApiMethodsToCall = [
  'setDeviceConfig',
  'switchToIoServer',
  'setAutomationRuleActive',
  'republishWholeState',
  'reboot',
];
export const TOPIC_TYPE_SEPARATOR = '|';
export const TOPIC_SEPARATOR = '/';


/**
 * Types of topics
 * device - means call device action
 * api - call specific api
 * * republishWholeState - publish while device etc states
 * * blockIo true|false
 */
export default class ApiTopicsLogic {
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();
  private readonly context: Context;


  constructor(context: Context) {
    // TODO: вместо context использовать только то что нужно
    this.context = context;
  }

  init() {
    // listen to outcome messages from api and send them to mqtt broker
    this.context.state.onChange(this.handleStateChange);
  }

  destroy() {
    this.outcomeEvents.destroy();
  }


  /**
   * Call this when you have received an income message
   */
  incomeMessage = async (fullTopic: string, data: string) => {
    const [topicType, body] = this.parseTopic(fullTopic);

    switch (topicType) {
      case 'device':
        const [deviceId, actionName] = splitFirstElement(body, TOPIC_SEPARATOR);

        await this.action(deviceId, actionName, data);
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
      this.context.log.error(`Can't publish device state: ${err}`);
    }
  }

  private async callApi(apiMethodName: string, data: string): Promise<void> {
    if (!allowedApiMethodsToCall.includes(apiMethodName)) {
      return this.context.log.warn(`Restricted or unsupported api method has been called "${apiMethodName}"`);
    }

    this.context.log.debug(`ApiTopicsLogic income call api method "${apiMethodName}": ${data}`);

    const args: (JsonTypes | undefined)[] = parseArgs(data);

    await this.context.system.apiManager.callApi(apiMethodName, args);
  }

  private async action(deviceId: string, actionName?: string, data?: string) {
    if (!actionName) {
      throw new Error(`ApiTopicsLogic.action: no actionName: "${deviceId}"`);
    }

    // income string-type api message - call device action
    this.context.log.debug(`ApiTopicsLogic income action call of device ${deviceId}${TOPIC_SEPARATOR}${actionName}: ${data}`);

    const args: (JsonTypes | undefined)[] = parseArgs(data);

    await this.context.system.apiManager.callApi('action', [deviceId, actionName, ...args]);
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
    const state: Dictionary | undefined = this.context.state.getState(category, stateName);

    if (!state) return;

    for (let paramName of changedParams) {
      const resolvedParamName: string | undefined = (paramName === DEFAULT_DEVICE_STATUS) ? undefined : paramName;
      const topicBody = combineTopic(TOPIC_SEPARATOR, stateName, stateType, resolvedParamName);
      const data: string = JSON.stringify(state[paramName]);

      this.emitOutcomeMsg(topicType, topicBody, data);
    }
  }

  private emitOutcomeMsg(topicType: TopicType, topicBody: string, data: string) {
    const topic = combineTopic(TOPIC_TYPE_SEPARATOR, topicType, topicBody);

    this.context.log.debug(`ApiTopicsLogic outcome: ${topic} - ${JSON.stringify(data)}`);
    this.outcomeEvents.emit(topic, data);
  }

}
