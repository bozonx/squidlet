import ServiceBase from '../../app/entities/ServiceBase';
import categories from '../../app/dict/categories';
import Message from '../../messenger/interfaces/Message';
import LogLevel from '../../app/interfaces/LogLevel';
import * as defaultLogger from './defaultLogger';
import {LOG_LEVELS} from '../../app/dict/constants';


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
        this.hostPublishHandler(hostId, message.topic as LogLevel, logMessage);
      };

      const allowedLogLevels: string[] = this.calcLogLevel(this.env.host.config.config.logLevel);

      // listen to allowed levels
      for (let level of allowedLogLevels) {
        this.env.messenger.subscribe(hostId, categories.logger, level, handler);
      }
    }
  }

  private hostPublishHandler = async (hostId: string, level: LogLevel, message: string): Promise<void> => {
    defaultLogger[level](message);
  }

  private calcLogLevel(logLevel: LogLevel): string[] {
    const currentLevelIndex: number = LOG_LEVELS.indexOf(logLevel);

    return LOG_LEVELS.slice(currentLevelIndex);
  }

}
