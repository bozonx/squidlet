import ServiceBase from 'system/baseServices/ServiceBase';
import {combineTopic} from 'system/helpers/helpers';
import {JsonTypes} from 'system/interfaces/Types';
import {GetDriverDep} from 'system/entities/EntityBase';
import {StateCategories} from 'system/interfaces/States';
import {Mqtt} from '../../drivers/Mqtt/Mqtt';
import ApiTopics, {TOPIC_SEPARATOR} from './ApiTopics';


interface Props {
  protocol: string;
  host: string;
  port: string;
}


export default class MqttApiTopics extends ServiceBase<Props> {
  // infinity session
  private sessionId: string = '';
  private apiTopics?: ApiTopics;
  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqtt = await getDriverDep('Mqtt')
      .getInstance(this.props);

    this.sessionId = this.env.system.sessions.newSession(0);
    this.apiTopics = new ApiTopics();
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqtt.onMessage(this.handleIncomeMessages);

    // listen to outcome messages from api and send them to mqtt broker
    this.env.system.state.onChange(this.handlerStateChange);
    // this.env.api.onPublish((topic: string, data: JsonTypes, isRepeat?: boolean) => {
    //   this.publishHandler(topic, data, isRepeat)
    //     .catch(this.env.log.error);
    // });
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
    // if (topic === REMOTE_CALL_TOPIC) {
    // }

    // if not remote call that it is a device action call
    await this.callDeviceAction(topic, data);
  });

  private handlerStateChange = (category: number, stateName: string, changedParams: string[]) => {
    if (category === StateCategories.devicesStatus) {
      // TODO: publish to mqtt
    }
    else if (category === StateCategories.devicesConfig) {
      // TODO: publish to mqtt
    }
  }

  /**
   * Publish outcome messages to broker
   */
  private publishHandler = async (topic: string, data: JsonTypes, isRepeat?: boolean) => {
    // TODO: remove
    if (isRepeat) {
      this.env.log.debug(`MqttApi outcome (republish): ${topic} - ${JSON.stringify(data)}`);
    }
    else {
      this.env.log.info(`MqttApi outcome: ${topic} - ${JSON.stringify(data)}`);
    }

    // TODO: если это массив то не известно это список параметров или массив для передачи как один параметр
    // TODO: можен надо сериализовать ????

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
