import Logger from '../../../../squidlet-networking/src/interfaces/Logger';
import LogLevel from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';
import {calcAllowedLogLevels} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';


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
