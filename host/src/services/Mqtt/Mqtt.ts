import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDevConnection} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';
import categories from '../../app/dict/categories';
import DeviceData from '../../app/interfaces/DeviceData';
import {combineTopic, parseValue, splitTopic} from '../../helpers/helpers';


interface Props {
  protocol: string;
  host: string;
  port: string;
  listenHosts: string[];
}

export default class Mqtt extends ServiceBase<Props> {
  private get mqttDev(): MqttDevConnection {
    return this.depsInstances.mqttDev as MqttDevConnection;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqttDev = await getDriverDep('Mqtt.dev')
      .connect(this.props);
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
    const hosts: string[] = (this.props.listenHosts.length)
      ? this.props.listenHosts
      : this.env.host.getAllTheHostsIds();

    for (let hostId of hosts) {
      // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
      const handler = (data: DeviceData) => {
        // TODO: обработка ошибки промиса
        this.hostPublishHandler(hostId, data);
      };

      // listen to publish messages
      this.env.messenger.subscribeCategory(hostId, categories.externalDataOutcome, handler);
    }
  }

  /**
   * Process income messages
   */
  private messagesHandler = (topic: string, data: string): Promise<void> => {
    this.env.log.info(`MQTT income: ${topic} - ${data}`);

    // TODO: если data - binary???
    // TODO: что если неизвестный формат или хоста не существует ???

    const { id, subTopic } = splitTopic(topic);
    const toHost = this.env.host.resolveHostIdByEntityId(id);
    const incomeData: DeviceData = {
      id,
      subTopic,
      // TODO: а если json ????
      // parse number, boolean etc
      data: parseValue(data),
    };

    return this.env.messenger.send(toHost, categories.externalDataIncome, id, incomeData);
  }

  private hostPublishHandler = async (hostId: string, data: DeviceData): Promise<void> => {
    const topic: string = combineTopic(data.id, data.subTopic);

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
        const topic: string = combineTopic(deviceId, action);

        this.env.log.info(`MQTT subscribe: ${topic}`);

        // TODO: обработать ошибку промиса

        this.subscribe(topic);
      }
    }
  }

}
