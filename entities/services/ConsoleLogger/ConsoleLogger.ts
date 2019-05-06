import ServiceBase from 'system/baseServices/ServiceBase';
import LogLevel, {LOG_LEVELS} from 'system/interfaces/LogLevel';
import categories from 'system/dict/categories';
import {calcAllowedLogLevels} from '../../../system/helpers/helpers';


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
    console.warn(message);
  },

  error(message: string) {
    console.error(message);
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
    const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(this.props.logLevel);

    // listen to allowed levels
    for (let level of allowedLogLevels) {
      this.env.events.addListener(categories.logger, level, (message: string) => {
        if (!LOG_LEVELS.includes(level)) return consoleLog.error(`Unsupported level: ${level}`);

        (consoleLog as any)[level](message);
      });
    }
  }

}
