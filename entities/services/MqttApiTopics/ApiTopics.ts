// TODO: review paths
import {splitFirstElement} from '../../../system/helpers/strings';
import {combineTopic, parseValue} from '../../../system/helpers/helpers';
import {JsonTypes} from '../../../system/interfaces/Types';
import {trim} from '../../../system/helpers/lodashLike';

type TopicType = 'device' | 'api';

const topicTypes = ['device', 'api'];
const TOPIC_TYPE_SEPARATOR = '/';


/**
 * Types of topics
 * device - means call device action
 * api - call specific api
 * * publishWholeState - publish while device etc states
 * * blockIo true|false
 */
export default class ApiTopics {
  constructor() {

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
        // TODO: !!!!
        break;
    }
  }

  onOutcome(cb: (topic: string, data: string | Uint8Array) => void) {

  }

  // run(topicType: TopicType, topicBody: string, data: string | Uint8Array) {
  //   const topic: string = combineTopic(TOPIC_TYPE_SEPARATOR, topicType, topicBody);
  // }


  private async callDeviceAction(topic: string, data: string | Uint8Array) {
    // income string-type api message - call device action
    this.env.log.info(`MqttApi income device action call: ${topic} ${JSON.stringify(data)}`);

    const args: JsonTypes[] = this.parseArgs(data);
    const [deviceId, actionName] = splitFirstElement(topic, this.env.system.systemConfig.topicSeparator);

    if (!actionName) {
      throw new Error(`MqttApi.callDeviceAction: Not actionName: "${topic}"`);
    }

    await this.env.api.callDeviceAction(deviceId, actionName, args);
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
