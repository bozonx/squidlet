import LogLevel from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';
import Context from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import {SystemEvents} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';


export default class LogPublisher {
  readonly context: Context;


  constructor(context: Context) {
    this.context = context;
  }

  debug = (message: string) => {
    this.emit('debug', message);
  }

  info = (message: string) => {
    this.emit('info', message);
  }

  warn = (message: string) => {
    this.emit('warn', message);
  }

  error = (message: string | Error) => {
    this.emit('error', String(message));
  }


  private emit(level: LogLevel, message: string) {
    // const eventName = `${SystemEvents.logger}_${level}`;
    //
    // this.context.system.events.emit(eventName, message, level);
    this.context.system.events.emit(SystemEvents.logger, level, message);
  }

}
