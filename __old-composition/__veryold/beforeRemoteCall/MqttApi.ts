import ServiceBase from 'system/baseServices/ServiceBase';
import MqttIo, {MqttConnection} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/MqttIo.js';
import {ApiTypes} from 'system/Api';


interface Props {
  protocol: string;
  host: string;
  port: string;
}


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
    this.env.api.onOutcome(this.outcomeHandler);
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
    this.env.api.income(topic, data)
      .catch(this.env.log.error);
  }

  /**
   * Publish outcome messages to broker
   */
  private outcomeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => {
    if (type === 'deviceOutcome') {
      this.mqttConnection.publish(topic, data)
        .catch(this.env.log.error);
    }
    // TODO: support other types
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
