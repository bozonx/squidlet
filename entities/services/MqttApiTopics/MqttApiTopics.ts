import ServiceBase from 'system/baseServices/ServiceBase';
import {combineTopic} from 'system/helpers/helpers';
import {GetDriverDep} from 'system/entities/EntityBase';
import {Mqtt} from '../../drivers/Mqtt/Mqtt';
import {TOPIC_SEPARATOR} from '../../../system/ApiTopics';


interface Props {
  protocol: string;
  host: string;
  port: string;
}


export default class MqttApiTopics extends ServiceBase<Props> {
  // infinity session
  private sessionId: string = '';
  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqtt = await getDriverDep('Mqtt')
      .getInstance(this.props);

    this.sessionId = this.env.system.sessions.newSession(0);
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqtt.onMessage(this.handleIncomeMessages);
    // listen to outcome messages and pass them to mqtt
    this.env.system.apiTopics.onOutcome(this.publishOutcomeHandler);
  }

  protected devicesDidInit = async () => {
    // register subscribers after app init
    await this.subscribeToDevices();
  }

  destroy = async () => {
    this.env.system.sessions.shutDownImmediately(this.sessionId);
  }


  /**
   * Processing income messages from broker
   */
  private handleIncomeMessages = this.wrapErrors(async (topic: string, data: string | Uint8Array) => {
    // TODO: use prefix - device.
    await this.env.system.apiTopics.incomeMessage(topic, data);
  });

  /**
   * Publish outcome messages to broker
   */
  private publishOutcomeHandler = async (topic: string, data: string | Uint8Array) => {
    const dataToSend: string = JSON.stringify(data);

    return this.mqtt.publish(topic, dataToSend);
  }

  /**
   * Subscribe to all the device's actions calls on broker
   */
  private subscribeToDevices = async () => {
    this.env.log.info(`--> Register MQTT subscribers of devices actions`);

    const devicesActionsTopics: string[] = this.getDevicesActionTopics();

    for (let topic of devicesActionsTopics) {
      this.env.log.info(`MQTT subscribe: ${topic}`);

      await this.mqtt.subscribe(topic);
    }
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
        const topic: string = combineTopic(TOPIC_SEPARATOR, deviceId, actionName);

        topics.push(topic);
      }
    }

    return topics;
  }

}
