import ServiceBase from 'system/baseServices/ServiceBase';
import DeviceData from 'system/interfaces/DeviceData';
import {combineTopic, parseValue, splitTopicId} from 'system/helpers/helpers';
import MqttDev from 'system/interfaces/io/MqttDev';
import categories from 'system/dict/categories';


interface Props {
  protocol: string;
  host: string;
  port: string;
  //listenHosts: string[];
}

export default class MqttSevice extends ServiceBase<Props> {
  private get mqttDev(): MqttDev {
    return this.depsInstances.mqttDev as MqttDev;
  }

  protected willInit = async () => {
    const mqttDev: any = this.env.getIo('Mqtt');

    this.depsInstances.mqttDev = await mqttDev.connect(this.props);
  }

  protected didInit = async () => {
    this.mqttDev.onMessage(this.messagesHandler);
    this.listenHostsPublishes();
    // register subscribers after app init
    this.env.system.onAppInit(() => {
      this.env.log.info(`--> Register MQTT subscribers of devices actions`);
      this.subscribeToDevices();
    });
  }


  /**
   * Publish custom topic
   */
  async publish(topic: string, data: string | Uint8Array | undefined) {
    await this.mqttDev.publish(topic, data);
  }

  /**
   * Subscribe on suctom topic
   */
  async subscribe(topic: string) {
    await this.mqttDev.subscribe(topic);
  }


  protected destroy = () => {
    // TODO: remove listener
  }


  /**
   * Start listen to publish messages of all the hosts.
   */
  private listenHostsPublishes() {
    // get hosts list from props or use all the hosts
    // const hosts: string[] = (this.props.listenHosts.length)
    //   ? this.props.listenHosts
    //   : this.env.host.getAllTheHostsIds();

    const hosts: string[] = ['master'];

    for (let hostId of hosts) {
      // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
      const handler = (data: DeviceData) => {
        // TODO: обработка ошибки промиса
        this.hostPublishHandler(hostId, data);
      };


      // TODO: save id

      // listen to publish messages
      this.env.events.addCategoryListener(categories.externalDataOutcome, handler);
    }
  }

  /**
   * Process income messages
   */
  private messagesHandler = async (topic: string, data: string): Promise<void> => {
    this.env.log.info(`MQTT income: ${topic} - ${data}`);

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???

    const [ id, subTopic ] = splitTopicId(this.env.system.systemConfig.topicSeparator, topic);

    if (!subTopic) throw new Error(`There isn't a subtopic of topic: "${topic}"`);

    //const toHost = this.env.host.resolveHostIdByEntityId(id);
    const incomeData: DeviceData = {
      id,
      subTopic,
      // TODO: а если json ????
      // parse number, boolean etc
      data: parseValue(data),
    };

    this.env.events.emit(categories.externalDataIncome, id, incomeData);
  }

  private hostPublishHandler = async (hostId: string, data: DeviceData): Promise<void> => {
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

        this.subscribe(topic);
      }
    }
  }

}
