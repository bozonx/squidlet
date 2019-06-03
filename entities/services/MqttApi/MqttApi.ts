import ServiceBase from 'system/baseServices/ServiceBase';
import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {combineTopic, parseValue} from 'system/helpers/helpers';
import {JsonTypes} from 'system/interfaces/Types';
import {splitFirstElement} from 'system/helpers/strings';
import {trim} from 'system/helpers/lodashLike';
import {GetDriverDep} from 'system/entities/EntityBase';
import {Mqtt} from '../../drivers/Mqtt/Mqtt';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

const REMOTE_CALL_TOPIC = 'remoteCall';


export default class MqttApi extends ServiceBase<Props> {
  // infinity session
  private sessionId: string = '';
  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqtt = await getDriverDep('WsServerSessions')
      .getInstance(this.props);

    this.sessionId = this.env.system.sessions.newSession(0);
  }

  protected didInit = async () => {
    this.env.api.onOutcomeRemoteCall((sessionId: string, message: RemoteCallMessage) => {
      if (sessionId !== this.sessionId) return;

      this.handleOutcomeRemoteCall(message);
    });

    // listen to income messages from mqtt broker
    await this.mqtt.onMessage((topic: string, data: string | Uint8Array) => {
      this.handleIncomeMessages(topic, data)
        .catch(this.env.log.error);
    });

    // listen to outcome messages from api and send them to mqtt broker
    this.env.api.onPublish((topic: string, data: JsonTypes, isRepeat?: boolean) => {
      this.publishHandler(topic, data, isRepeat)
        .catch(this.env.log.error);
    });

    // register subscribers after app init
    this.env.system.onAppInit(this.subscribeToDevices);
  }

  destroy = async () => {
    this.env.system.sessions.shutDownImmediately(this.sessionId);
    await this.mqtt.destroy();
  }


  // TODO: review
  async callDeviceAction(topic: string, data?: string | Uint8Array) {
    // income string-type api message - call device action
    this.env.log.info(`MqttApi income device action call: ${topic} ${JSON.stringify(data)}`);

    const args: JsonTypes[] = this.parseArgs(data);
    const [deviceId, actionName] = splitFirstElement(topic, this.env.system.systemConfig.topicSeparator);

    if (!actionName) {
      throw new Error(`MqttApi.callDeviceAction: Not actionName: "${topic}"`);
    }

    await this.env.api.callDeviceAction(deviceId, actionName, args);
  }


  /**
   * Processing income messages from broker
   */
  private handleIncomeMessages = async (topic: string, data: string | Uint8Array) => {
    // TODO: use prefix
    if (topic === REMOTE_CALL_TOPIC) {
      // income remoteCall message
      const message: RemoteCallMessage = deserializeJson(data);

      return this.env.api.incomeRemoteCall(this.sessionId, message);
    }

    await this.callDeviceAction(topic, data);
  }

  private handleOutcomeRemoteCall = async (message: RemoteCallMessage) => {
    const binData: Uint8Array = serializeJson(message);

    // TODO: use prefix
    return this.mqtt.publish(REMOTE_CALL_TOPIC, binData);
  }

  /**
   * Publish outcome messages to broker
   */
  private publishHandler = async (topic: string, data: JsonTypes, isRepeat?: boolean) => {
    if (isRepeat) {
      this.env.log.debug(`Api outcome (republish): ${topic} - ${JSON.stringify(data)}`);
    }
    else {
      this.env.log.info(`Api outcome: ${topic} - ${JSON.stringify(data)}`);
    }

    // TODO: если это массив то не известно это список параметров или массив для передачи как один параметр
    // TODO: можен надо сериализовать ????

    const dataToSend: string = JSON.stringify(data);

    this.mqttConnection.publish(topic, dataToSend)
      .catch(this.env.log.error);
  }

  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  private getDevicesActionTopics(): string[] {
    const topics: string[] = [];
    const devicesIds: string[] = this.env.system.devicesManager.getInstantiatedDevicesIds();

    for (let deviceId of devicesIds) {
      const device = this.env.system.devicesManager.getDevice(deviceId);

      for (let actionName of device.getActionsList()) {
        const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, deviceId, actionName);

        topics.push(topic);
      }
    }

    return topics;
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

  /**
   * Subscribe to all the device's actions calls on broker
   */
  private subscribeToDevices = async () => {
    this.env.log.info(`--> Register MQTT subscribers of devices actions`);

    const devicesActionsTopics: string[] = this.getDevicesActionTopics();

    for (let topic of devicesActionsTopics) {
      this.env.log.info(`MQTT subscribe: ${topic}`);

      await this.mqttConnection.subscribe(topic);
    }
  }

}
