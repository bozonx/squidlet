import ServiceBase from 'system/baseServices/ServiceBase';
import {combineTopic} from 'system/helpers/helpers';
import MqttIo from 'system/interfaces/io/MqttIo';
import {ApiTypes} from 'system/Api';


interface Props {
  protocol: string;
  host: string;
  port: string;
  //listenHosts: string[];
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
    await this.mqttIo.onMessage(this.messagesHandler);
    this.env.api.subscribe(this.apiSubscribeHandler);
    // register subscribers after app init
    this.env.system.onAppInit(() => {
      this.env.log.info(`--> Register MQTT subscribers of devices actions`);
      this.subscribeToDevices();
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

  private apiSubscribeHandler = (type: ApiTypes, topic: string, data?: string | Uint8Array) => {
    if (type === 'deviceOutcome') {
      this.mqttIo.publish(topic, data)
        .catch(this.env.log.error);
    }
    // TODO: support other types
  }

  private subscribeToDevices() {
    const devicesActions: {[index: string]: string[]} = this.env.api.getDevicesActions();

    for (let deviceId of Object.keys(devicesActions)) {
      for (let action of devicesActions[deviceId]) {
        const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, deviceId, action);

        this.env.log.info(`MQTT subscribe: ${topic}`);

        // TODO: обработать ошибку промиса

        this.subscribe(topic)
          .catch(this.env.log.error);
      }
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
