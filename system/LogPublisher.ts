import System from './System';
import {LOGGER_EVENT} from './dict/systemEvents';
import LogLevel from './interfaces/LogLevel';


export default class LogPublisher {
  readonly system: System;


  constructor(system: System) {
    this.system = system;
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

    this.system.events.emit(eventName, message, level);
    this.system.events.emit(LOGGER_EVENT, message, level);
  }

}
