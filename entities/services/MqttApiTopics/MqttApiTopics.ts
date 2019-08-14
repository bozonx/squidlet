import ServiceBase from 'system/base/ServiceBase';
import {combineTopic} from 'system/lib/helpers';
import {GetDriverDep} from 'system/base/EntityBase';

import {Mqtt, MqttProps} from '../../drivers/Mqtt/Mqtt';
import ApiTopicsLogic, {TOPIC_SEPARATOR, TOPIC_TYPE_SEPARATOR, TopicType} from './ApiTopicsLogic';


export default class MqttApiTopics extends ServiceBase<MqttProps> {
  get apiTopicsLogic(): ApiTopicsLogic {
    return this._apiTopicsLogic as any;
  }

  private _apiTopicsLogic?: ApiTopicsLogic;

  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this._apiTopicsLogic = new ApiTopicsLogic(this.context);
    this.apiTopicsLogic.init();
    this.depsInstances.mqtt = await getDriverDep('Mqtt')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqtt.onMessage(this.handleIncomeMessages);
    // listen to outcome messages and pass them to mqtt
    this.apiTopicsLogic.onOutcome(this.handleOutcomeMessages);
  }

  protected devicesDidInit = async () => {
    // TODO: должно ожидать соединения
    await this.mqtt.connectedPromise;
    await this.subscribeToDevices();
  }

  destroy = async () => {
    await this.apiTopicsLogic.destroy();
  }


  /**
   * Processing income messages from broker
   */
  private handleIncomeMessages = this.wrapErrors(async (topic: string, data: string | Uint8Array) => {
    // skip not apiTopic's messages
    if (!this.apiTopicsLogic.isSupportedTopic(topic)) return;

    if (typeof data !== 'string') {
      throw new Error(`MqttApiTopics incorrect data of topic "${topic}". It has to be a string`);
    }

    await this.apiTopicsLogic.incomeMessage(topic, data);
  });

  /**
   * Publish outcome messages to broker
   */
  private handleOutcomeMessages = async (topic: string, data: string) => {
    return this.mqtt.publish(topic, data);
  }

  /**
   * Subscribe to all the device's actions calls on broker
   */
  private subscribeToDevices = async () => {
    this.log.info(`--> Register MQTT subscribers of devices actions`);

    const devicesActionsTopics: string[] = this.getDevicesActionTopics();

    for (let topic of devicesActionsTopics) {
      this.log.info(`MQTT subscribe: ${topic}`);

      await this.mqtt.subscribe(topic);
    }
  }

  // TODO: move to logic
  /**
   * Get topics of all the device's actions like ['room1/place2/deviceId.actionName', ...]
   */
  private getDevicesActionTopics(): string[] {
    const topics: string[] = [];
    const devicesIds: string[] = this.context.system.devicesManager.getInstantiatedDevicesIds();

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

}
