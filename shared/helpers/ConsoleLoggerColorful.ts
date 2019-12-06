import Logger from '../../system/interfaces/Logger';
import LogLevel from '../../system/interfaces/LogLevel';
import {calcAllowedLogLevels} from '../../system/lib/helpers';


export default class ConsoleLoggerColorful implements Logger {
  private readonly allowDebug: boolean;
  private readonly allowInfo: boolean;
  private readonly allowWarn: boolean;


  constructor(level: LogLevel = 'info') {
    const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(level);

    this.allowDebug = allowedLogLevels.includes('debug');
    this.allowInfo = allowedLogLevels.includes('info');
    this.allowWarn = allowedLogLevels.includes('warn');
  }


  debug = (message: string) => {
    if (!this.allowDebug) return;

    console.info(`DEBUG: ${message}`);
  }

  info = (message: string) => {
    if (!this.allowInfo) return;

    console.info(message);
  }

  warn = (message: string) => {
    if (!this.allowWarn) return;

    console.warn(`WARNING: ${message}`);
  }

  error = (message: string | Error) => {
    console.error(`ERROR: ${message}`);
  }

}
