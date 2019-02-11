import ServiceBase from '../../../host/baseServices/ServiceBase';
import categories from '../../../host/dict/categories';
import LogLevel from '../../../host/interfaces/LogLevel';
import * as defaultLogger from './defaultLogger';
import {LOG_LEVELS} from '../../../host/dict/constants';


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
      // TODO: не использовать message
      const handler = (logMessage: string, message: any) => {
        // TODO: обработка ошибки промиса
        this.hostPublishHandler(hostId, message.topic as LogLevel, logMessage);
      };

      const allowedLogLevels: string[] = this.calcLogLevel(this.env.host.config.config.logLevel);

      // listen to allowed levels
      for (let level of allowedLogLevels) {
        // TODO: не использовать messager - use events
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
