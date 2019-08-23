import LogLevel from './interfaces/LogLevel';
import Context from './Context';
import {LOGGER_EVENT} from './constants';


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

  error = (message: string) => {
    this.emit('error', message);
  }


  private emit(level: LogLevel, message: string) {
    const eventName = `${LOGGER_EVENT}_${level}`;

    this.context.system.events.emit(eventName, message, level);
    this.context.system.events.emit(LOGGER_EVENT, message, level);
  }

}
