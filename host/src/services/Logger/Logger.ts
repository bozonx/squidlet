import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDevConnection} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';
import categories from '../../app/dict/categories';
import DeviceData from '../../app/interfaces/DeviceData';
import {combineTopic} from '../../helpers/helpers';
import Message from '../../messenger/interfaces/Message';
import LogLevel from '../../app/interfaces/LogLevel';


interface Props {
  listenHosts: string[];
}

export default class Logger extends ServiceBase<Props> {
  protected didInit = async () => {
    this.listenHosts();
  }

  protected destroy = () => {
    // TODO: remove listener
  }


  private listenHosts() {
    // get hosts list from props or use all the hosts
    const hosts: string[] = (this.props.listenHosts.length)
      ? this.props.listenHosts
      : this.env.host.getAllTheHostsIds();

    for (let hostId of hosts) {
      // TODO: можно обойтись и без создания отдельного хэндлера - ипользвать метод класса, но при удалении он удалиться везде
      const handler = (logMessage: string, message: Message) => {
        // TODO: обработка ошибки промиса
        this.hostPublishHandler(hostId, message.topic, logMessage);
      };

      // listen to publish messages
      this.env.messenger.subscribe(hostId, categories.logger, 'debug', handler);
      this.env.messenger.subscribe(hostId, categories.logger, 'verbose', handler);
      this.env.messenger.subscribe(hostId, categories.logger, 'info', handler);
      this.env.messenger.subscribe(hostId, categories.logger, 'warn', handler);
      this.env.messenger.subscribe(hostId, categories.logger, 'error', handler);
      this.env.messenger.subscribe(hostId, categories.logger, 'fatal', handler);
    }
  }

  private hostPublishHandler = async (hostId: LogLevel, level: string, message: string): Promise<void> => {
    console.log(11111111111, hostId, level, message)
  }

}
