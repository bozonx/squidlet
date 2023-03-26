import ServiceBase from 'base/ServiceBase';
import LogLevel, {LOG_LEVELS} from 'interfaces/LogLevel';
import {calcAllowedLogLevels} from 'lib/helpers';
import {SystemEvents} from 'constants';


const consoleLog = {
  debug(message: string) {
    console.info(`DEBUG: ${message}`);
  },

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
    const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(this.props.logLevel);

    // listen to allowed levels
    for (let level of allowedLogLevels) {
      const eventName = `${SystemEvents.logger}_${level}`;

      this.context.system.events.addListener(eventName, (message: string, level: LogLevel) => {
        if (!LOG_LEVELS.includes(level)) return consoleLog.error(`Unsupported level: ${level}`);

        (consoleLog as any)[level](message);
      });
    }

    // this.env.events.addListener(LOGGER_EVENT, (level: LogLevel, message: string) => {
    //   if (!allowedLogLevels.includes(level)) return;
    //
    //   (consoleLog as any)[level](message);
    // });

    // const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(this.props.logLevel);
    //
    // // listen to allowed levels
    // for (let level of allowedLogLevels) {
    //   this.env.events.addListener(LOGGER_EVENT, (level: LogLevel, message: string) => {
    //     if (!LOG_LEVELS.includes(level)) return consoleLog.error(`Unsupported level: ${level}`);
    //
    //     (consoleLog as any)[level](message);
    //   });
    // }
  }

}
