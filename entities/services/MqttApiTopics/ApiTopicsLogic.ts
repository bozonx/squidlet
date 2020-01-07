import {splitFirstElement} from 'system/lib/strings';
import {combineTopic, parseArgs} from 'system/lib/helpers';
import {Dictionary, JsonTypes} from 'system/interfaces/Types';
import {StateCategories} from 'system/interfaces/States';
import IndexedEvents from 'system/lib/IndexedEvents';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';
import Context from 'system/Context';


type OutcomeHandler = (topic: string, data?: string) => void;
type TopicType = 'api' | 'action' | 'status' | 'config';

const TOPIC_SEPARATOR = '/';
const topicTypes = ['api', 'action', 'status', 'config'];


/**
 * Call api method or manage devices via simple MQTT string api.
 * See doc `doc/mqttApi.md` for details.
 */
export default class ApiTopicsLogic {
  private readonly context: Context;
  private readonly prefix?: string;
  private readonly outcomeEvents = new IndexedEvents<OutcomeHandler>();


  constructor(context: Context, prefix?: string) {
    this.context = context;
    this.prefix = prefix;
  }

  init() {
    // listen to outcome messages from devices state and send them to mqtt broker
    this.context.state.onChange(this.handleStateChange);
  }

  destroy() {
    this.outcomeEvents.destroy();
  }


  /**
   * Call this when you have received an income message
   */
  incomeMessage = (fullTopic: string, data: string): Promise<void> => {
    // TODO: выбрасывает ошибку - обработать
    const [prefix, topicType, body] = this.parseTopic(fullTopic);

    // skip not ours prefix
    if (prefix !== this.prefix) return Promise.resolve();

    switch (topicType) {
      case 'action':
        const [deviceId, actionName] = splitFirstElement(body, TOPIC_SEPARATOR);

        return this.callAction(deviceId, actionName, data);
      case 'api':
        return this.callApi(body, data);
    }
    // skip others
    return Promise.resolve();
  }

  /**
   * Listen messages which are sent outcome from this host.
   */
  onOutcome(cb: OutcomeHandler): number {
    return this.outcomeEvents.addListener(cb);
  }

  /**
   * Remove outcome listener
   */
  removeListener(handlerIndex: number) {
    this.outcomeEvents.removeListener(handlerIndex);
  }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  getTopicsToSubscribe(): string[] {
    // TODO: review
    // TODO: так же вызов api
    // TODO: add prefix
    const topics: string[] = [];
    const devicesIds: string[] = this.context.system.devicesManager.getIds();

    for (let deviceId of devicesIds) {
      const device = this.context.system.devicesManager.getDevice(deviceId);

      for (let actionName of device.getActionsList()) {
        const deviceActionTopic: string = combineTopic(TOPIC_SEPARATOR, deviceId, actionName);
        const deviceType: TopicType = 'device';
        const topic: string = combineTopic(TOPIC_TYPE_SEPARATOR, deviceType, deviceActionTopic);

        topics.push(topic);
      }
    }

    return topics;
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

  private callApi(apiMethodName: string, data: string): Promise<void> {
    this.context.log.debug(`MqttApiTopics income call api method "${apiMethodName}": ${data}`);

    const args: (JsonTypes | undefined)[] = parseArgs(data);

    return this.context.system.apiManager.callApi(apiMethodName, args);
  }

  private callAction(deviceId: string, actionName?: string, data?: string) {
    if (!actionName) {
      throw new Error(`MqttApiTopics.callAction: no actionName: "${deviceId}"`);
    }

    this.context.log.debug(`MqttApiTopics income action device call ${deviceId}${TOPIC_SEPARATOR}${actionName}: ${data}`);

    const args: (JsonTypes | undefined)[] = parseArgs(data);

    return this.context.system.apiManager.callApi('action', [deviceId, actionName, ...args]);
  }

  // TODO: review
  /**
   * Parse topic to [prefix, topicType, topicBody].
   */
  private parseTopic(topic: string): [(string | undefined), TopicType, string] {

    // TODO: support prefix
    // TODO: нужно ли выбрасывать ошибку???

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

  // TODO: review
  private publishDeviceState(
    topicType: TopicType,
    category: number,
    stateName: string,
    changedParams: string[]
  ) {
    const state: Dictionary | undefined = this.context.state.getState(category, stateName);

    // if state == undefined means state hasn't been registered
    if (!state) return;

    for (let paramName of changedParams) {
      // if default then don't use param name
      const resolvedParamName: string | undefined = (paramName === DEFAULT_DEVICE_STATUS)
        ? undefined
        : paramName;
      const topicBody = combineTopic(TOPIC_SEPARATOR, stateName, resolvedParamName);
      const value: string = JSON.stringify(state[paramName]);

      this.emitOutcomeMsg(topicType, topicBody, value);
    }
  }

  private emitOutcomeMsg(topicType: TopicType, topicBody: string, value?: string) {
    const topic = combineTopic(TOPIC_SEPARATOR, topicType, topicBody);

    this.context.log.debug(`MqttApiTopics outcome: ${topic} - ${JSON.stringify(value)}`);
    this.outcomeEvents.emit(topic, value);
  }

}


// private isSupportedTopic(topic: string): boolean {
//   const splat = splitFirstElement(topic, TOPIC_TYPE_SEPARATOR);
//
//   return topicTypes.includes(splat[0]);
// }
