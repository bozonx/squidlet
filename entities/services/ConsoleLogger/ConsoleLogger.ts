import ServiceBase from 'system/baseServices/ServiceBase';
import LogLevel from 'system/interfaces/LogLevel';
import {LOG_LEVELS} from 'system/dict/constants';
import categories from 'system/dict/categories';


const consoleLog = {
  debug(message: string) {
    console.info(message);
  },

  // verbose(message: string) {
  //   console.log(message);
  // },

  info(message: string) {
    console.info(message);
  },

  warn(message: string) {
    console.warn(`WARNING: ${message}`);
  },

  error(message: string) {
    console.error(`ERROR: ${message}`);
  },
};

interface Props {
  logLevel: LogLevel;
}

export default class ConsoleLogger extends ServiceBase<Props> {
  protected didInit = async () => {
    this.listenLevels();
  }


  private listenLevels() {
    const allowedLogLevels: LogLevel[] = this.calcAllowedLogLevels(this.props.logLevel);

    // listen to allowed levels
    for (let level of allowedLogLevels) {
      this.env.events.addListener(categories.logger, level, (message: string) => {
        if (!LOG_LEVELS.includes(level)) return consoleLog.error(`Unsupported level: ${level}`);

        (consoleLog as any)[level](message);
      });
    }
  }


  private calcAllowedLogLevels(logLevel: LogLevel): LogLevel[] {
    const currentLevelIndex: number = LOG_LEVELS.indexOf(logLevel);

    return LOG_LEVELS.slice(currentLevelIndex) as LogLevel[];
  }

}
