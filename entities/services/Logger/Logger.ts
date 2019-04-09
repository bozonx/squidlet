import ServiceBase from 'host/baseServices/ServiceBase';
import LogLevel from 'host/interfaces/LogLevel';
import {LOG_LEVELS} from 'host/dict/constants';
import categories from 'host/dict/categories';

import * as defaultLogger from './defaultLogger';


interface Props {
  //listenHosts: string[];
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
    // const hosts: string[] = (this.props.listenHosts.length)
    //   ? this.props.listenHosts
    //   : this.env.host.getAllTheHostsIds();

    const hosts: string[] = ['master'];

    for (let hostId of hosts) {
      const allowedLogLevels: string[] = this.calcLogLevel(this.env.host.config.config.logLevel);

      // listen to allowed levels
      for (let level of allowedLogLevels) {
        this.env.events.addListener(categories.logger, level, this.logEventsHandler);
      }
    }
  }

  private logEventsHandler = (data: {level: LogLevel, message: string}) => {
    defaultLogger[data.level](data.message);
  }

  private calcLogLevel(logLevel: LogLevel): string[] {
    const currentLevelIndex: number = LOG_LEVELS.indexOf(logLevel);

    return LOG_LEVELS.slice(currentLevelIndex);
  }

}
