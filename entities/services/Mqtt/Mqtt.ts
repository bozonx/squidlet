import ServiceBase from 'host/baseServices/ServiceBase';
import {GetDriverDep} from 'host/entities/EntityBase';
import DeviceData from 'host/interfaces/DeviceData';
import {combineTopic, parseValue, splitTopic} from 'host/helpers/helpers';
import Mqtt from 'host/interfaces/dev/Mqtt';
import categories from 'host/dict/categories';


interface Props {
  protocol: string;
  host: string;
  port: string;
  listenHosts: string[];
}

export default class MqttSevice extends ServiceBase<Props> {
  private get mqttDev(): Mqtt {
    return this.depsInstances.mqttDev as Mqtt;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    //this.depsInstances.mqttDev = await getDriverDep('Mqtt.dev')
    const mqttDev: any = this.env.getDev('Mqtt');
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
    const hosts: string[] = (this.props.listenHosts.length)
      ? this.props.listenHosts
      : this.env.host.getAllTheHostsIds();

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

    const { id, subTopic } = splitTopic(topic);
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
