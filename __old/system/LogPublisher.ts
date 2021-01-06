import LogLevel from './interfaces/LogLevel';
import Context from '../../src/system/Context';
import {SystemEvents} from './constants';


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
