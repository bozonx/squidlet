import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDev} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';
import categories from '../../app/dict/categories';
import DeviceData from '../../app/interfaces/DeviceData';


interface Props {
  protocol: string;
  host: string;
  port: string;
  hosts: string[];
}

export default class Mqtt extends ServiceBase<Props> {
  private get mqttDev(): MqttDev {
    return this.depsInstances.mqttDev as MqttDev;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqttDev = await getDriverDep('Mqtt.dev')
      .connect(this.props);
    // this.depsInstances.mqttDriver = await getDriverDep('Mqtt.driver')
    //   .getInstance(this.props);
  }

  protected didInit = async () => {
    this.mqttDev.onMessage(this.messagesHandler);
    this.listenHostsPublishes();
  }

  protected destroy = () => {
    // TODO: remove listener
  }


  /**
   * Start listen to publish messages of all the hosts.
   */
  private listenHostsPublishes() {
    // TODO: listen event of all the hosts

    const hostId = 'master';

    // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
    const handler = (payload: any) => {
      this.hostPublishHandler(hostId, payload);
    };

    // listen to publish messages
    this.env.messenger.subscribeCategory(hostId, categories.devicesPublish, handler);
  }

  /**
   * Process income messages
   */
  private messagesHandler = (topic: string, data: string) => {
    // TODO: может ли быть data - undefined???
    // TODO: если data - binary???
    const { id, subTopic } = this.splitTopic(topic);
    const toHost = this.env.host.getHostIdByDeviceId();
    const incomeData: DeviceData = {
      subTopic,
      // parse number, boolean etc
      data: parseData(data),
    };

    this.env.messenger.send(toHost, categories.devicesIncome, id, incomeData);
  }

  private hostPublishHandler = (hostId: string, payload: any) => {
    const topic: string = this.combineTopic();

    this.mqttDev.publish();
  }

  private combineTopic() {
    // TODO: add
  }

}
