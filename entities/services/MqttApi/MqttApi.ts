import ServiceBase from 'system/baseServices/ServiceBase';
import MqttIo, {MqttConnection} from 'system/interfaces/io/MqttIo';
import {deserializeJson} from 'system/helpers/binaryHelpers';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {combineTopic} from 'system/helpers/helpers';
import {JsonTypes} from 'system/interfaces/Types';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

const REMOTE_CALL_TOPIC = 'remoteCall';


export default class MqttApi extends ServiceBase<Props> {
  private get mqttConnection(): MqttConnection {
    return this.depsInstances.mqttIo;
  }


  protected willInit = async () => {
    const mqttIo: MqttIo = this.env.getIo('Mqtt');

    this.depsInstances.mqttIo = await mqttIo.connect(this.props);
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqttConnection.onMessage(this.messagesHandler);

    // TODO: при обрыве соединения убить все хэндлеры

    // listen to outcome messages from api and send them to mqtt broker
    this.env.api.onPublish(this.publishHandler);
    // register subscribers after app init
    this.env.system.onAppInit(this.subscribeToDevices);
  }

  destroy = async () => {
    // TODO: может закрывать соединение на destroy и писать об этом ???
  }


  /**
   * Processing income messages from broker
   */
  private messagesHandler = async (topic: string, data?: string | Uint8Array): Promise<void> => {
    if (topic === REMOTE_CALL_TOPIC) {
      // income remoteCall message
      const message: RemoteCallMessage = deserializeJson(data);

      this.env.api.incomeRemoteCall(message)
        .catch(this.env.log.error);

      return;
    }

    // income string-type api message - call device action
    this.env.log.info(`Api income: ${topic} - ${JSON.stringify(data)}`);

    // TODO: если парамеры через запятую - то распарсить их
    // TODO: строковые параметры превратить в нормальные - parseValue
    // TODO: разложить topic на deviceId, action

    this.env.api.callDeviceAction(deviceId, action, data)
      .catch(this.env.log.error);

    // this.env.api.income(topic, data)
    //   .catch(this.env.log.error);
  }

  /**
   * Publish outcome messages to broker
   */
  private publishHandler = (topic: string, data: JsonTypes, isRepeat?: boolean) => {
    if (isRepeat) {
      this.system.log.debug(`Api outcome (republish): ${topic} - ${JSON.stringify(data)}`);
    }
    else {
      this.system.log.info(`Api outcome: ${topic} - ${JSON.stringify(data)}`);
    }

    if (type === 'deviceOutcome') {
      this.mqttConnection.publish(topic, data)
        .catch(this.env.log.error);
    }
    // TODO: support other types
  }

  private parseMessage(topic: string, data?: string | Uint8Array): ApiMessage {
    // TODO: add

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???
    const topic: string = combineTopic(
      this.system.systemConfig.topicSeparator,
      payload.deviceId,
      payload.subTopic
    );

    // , parseValue, splitTopicId

    // const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);
    //if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);
  }

  /**
   * Subscribe to all the device's actions calls on broker
   */
  private subscribeToDevices = async () => {
    this.env.log.info(`--> Register MQTT subscribers of devices actions`);

    const devicesActionsTopics: string[] = this.env.api.getDevicesActionTopics();

    for (let topic of devicesActionsTopics) {
      this.env.log.info(`MQTT subscribe: ${topic}`);

      await this.mqttConnection.subscribe(topic);
    }
  }

}
