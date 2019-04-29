import ServiceBase from 'system/baseServices/ServiceBase';
import LogLevel from 'system/interfaces/LogLevel';
import {LOG_LEVELS} from 'system/dict/constants';
import categories from 'system/dict/categories';


const consoleLog = {
  debug(message: string) {
    console.info(message);
  },

  verbose(message: string) {
    console.log(message);
  },

  info(message: string) {
    console.info(message);
  },

  warn(message: string) {
    console.warn(message);
  },

  error(message: string) {
    console.error(message);
  },
};

interface Props {
}

export default class ConsoleLogger extends ServiceBase<Props> {
  protected didInit = async () => {
    this.listenLevels();
  }


  private listenLevels() {
    const allowedLogLevels: LogLevel[] = this.calcAllowedLogLevels(this.env.host.config.config.logLevel);

    // listen to allowed levels
    for (let level of allowedLogLevels) {
      this.env.events.addListener(categories.logger, level, (message: string) => {
        (consoleLog as any)[level](message);
      });
    }
  }


  private calcAllowedLogLevels(logLevel: LogLevel): LogLevel[] {
    const currentLevelIndex: number = LOG_LEVELS.indexOf(logLevel);

    return LOG_LEVELS.slice(currentLevelIndex) as LogLevel[];
  }

}
