import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDev} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';
import categories from '../../app/dict/categories';
import Message from '../../messenger/interfaces/Message';


// TODO: add param hosts - список хостов которые слушать
interface Props {
  protocol: string;
  host: string;
  port: string;
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
   * Start listen all the hosts
   */
  private listenHostsPublishes() {
    // TODO: listen event of all the hosts

    const hostId = 'master';

    // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
    const handler = (payload: any) => {
      this.hostPublishHandler(hostId, payload);
    };

    // listen to publish of devices
    this.env.messenger.subscribeCategory(hostId, categories.devicesPublish, handler);
  }

  /**
   * Process income messages
   */
  private messagesHandler = (topic: string, data: string) => {
    // TODO: может ли быть data - undefined???
    // TODO: определить хост по id девайса
    const toHost = 'master';

    this.env.messenger.send(toHost, categories.mqttIncome, topic, data);
  }

  private hostPublishHandler = (hostId: string, payload: any) => {
    // TODO: !!!!
  }

}
