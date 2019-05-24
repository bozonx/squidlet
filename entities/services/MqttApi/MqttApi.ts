import ServiceBase from 'system/baseServices/ServiceBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {ApiTypes} from 'system/Api';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

export default class MqttSevice extends ServiceBase<Props> {
  private get mqttIo(): MqttIo {
    return this.depsInstances.mqttIo as any;
  }


  protected willInit = async () => {
    const mqttIo: any = this.env.getIo('Mqtt');

    this.depsInstances.mqttIo = await mqttIo.connect(this.props);
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqttIo.onMessage(this.messagesHandler);
    // listen to outcome messages from api and send them to mqtt broker
    this.env.api.onOutcome(this.outcomeHandler);
    // register subscribers after app init
    this.env.system.onAppInit(async () => {
      this.env.log.info(`--> Register MQTT subscribers of devices actions`);
      await this.subscribeToDevices();
    });
  }

  destroy = async () => {
    // TODO: remove listener
  }


  /**
   * Processing income messages
   */
  private messagesHandler = async (topic: string, data?: string | Uint8Array): Promise<void> => {
    this.env.log.info(`MQTT income: ${topic} - ${data}`);

    this.env.api.exec(topic, data)
      .catch(this.env.log.error);
  }

  private outcomeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => {
    if (type === 'deviceOutcome') {
      this.mqttIo.publish(topic, data)
        .catch(this.env.log.error);
    }
    // TODO: support other types
  }

  private async subscribeToDevices() {
    const devicesActions: string[] = this.env.api.getDevicesActionTopics();

    for (let topic of devicesActions) {
      this.env.log.info(`MQTT subscribe: ${topic}`);

      await this.mqttIo.subscribe(topic);
    }
  }

}


// /**
//  * Publish custom topic
//  */
// async publish(topic: string, data: string | Uint8Array | undefined) {
//   await this.mqttIo.publish(topic, data);
// }
//
// /**
//  * Subscribe on custom topic
//  */
// async subscribe(topic: string) {
//   await this.mqttIo.subscribe(topic);
// }
