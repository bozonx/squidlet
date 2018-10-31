import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDev} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';
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
    for (let hostId of this.props.listenHosts) {
      // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
      const handler = (payload: any) => {
        this.hostPublishHandler(hostId, payload);
      };

      // listen to publish messages
      this.env.messenger.subscribeCategory(hostId, categories.externalDataOutcome, handler);
    }
  }

  /**
   * Process income messages
   */
  private messagesHandler = (topic: string, data: string) => {

    // TODO: если data - binary???

    const { id, subTopic } = splitTopic(topic);
    const toHost = this.env.host.resolveHostIdByEntityId(id);
    const incomeData: DeviceData = {
      id,
      subTopic,
      // parse number, boolean etc
      data: parseValue(data),
    };

    this.env.messenger.send(toHost, categories.externalDataIncome, id, incomeData);
  }

  private hostPublishHandler = async (hostId: string, data: DeviceData): Promise<void> => {
    const topic: string = combineTopic(data.id, data.subTopic);

    await this.mqttDev.publish(topic, data.data);
  }

}
