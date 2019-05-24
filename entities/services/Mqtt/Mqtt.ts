import ServiceBase from 'system/baseServices/ServiceBase';
import DeviceData from 'system/interfaces/DeviceData';
import {combineTopic} from 'system/helpers/helpers';
import MqttIo from 'system/interfaces/io/MqttIo';
import categories from 'system/dict/categories';


interface Props {
  protocol: string;
  host: string;
  port: string;
  //listenHosts: string[];
}

export default class MqttSevice extends ServiceBase<Props> {
  private get mqttDev(): MqttIo {
    return this.depsInstances.mqttDev as any;
  }


  protected willInit = async () => {
    const mqttDev: any = this.env.getIo('Mqtt');

    this.depsInstances.mqttDev = await mqttDev.connect(this.props);
  }

  protected didInit = async () => {
    await this.mqttDev.onMessage(this.messagesHandler);
    this.env.events.addCategoryListener(categories.externalDataOutcome, this.hostPublishHandler);
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
   * Publish custom topic
   */
  async publish(topic: string, data: string | Uint8Array | undefined) {
    await this.mqttDev.publish(topic, data);
  }

  /**
   * Subscribe on custom topic
   */
  async subscribe(topic: string) {
    await this.mqttDev.subscribe(topic);
  }


  /**
   * Processing income messages
   */
  private messagesHandler = async (topic: string, data: string | Uint8Array): Promise<void> => {
    this.env.log.info(`MQTT income: ${topic} - ${data}`);

    this.env.system.api.exec(topic, data)
      .catch(this.env.log.error);
  }


  private hostPublishHandler = async (data: DeviceData): Promise<void> => {
    const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, data.id, data.subTopic);

    if (data.params && data.params.isRepeat) {
      this.env.log.debug(`MQTT outcome (republish): ${topic} - ${JSON.stringify(data.data)}`);
    }
    else {
      this.env.log.info(`MQTT outcome: ${topic} - ${JSON.stringify(data.data)}`);
    }

    await this.mqttDev.publish(topic, String(data.data));
  }

  private subscribeToDevices() {
    const devicesActions: {[index: string]: string[]} = this.env.host.getDevicesActions();

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
