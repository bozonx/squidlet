import System from './System';
import categories from './dict/categories';


export default class LogPublisher {
  readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  debug(message: string) {
    this.send('debug', `DEBUG: ${message}`);
  }

  // async verbose(message: string) {
  //   await this.send('verbose', message);
  // }

  info(message: string) {
    this.send('info', message);
  }

  warn(message: string) {
    this.send('warn', `WARNING: ${message}`);
  }

  error(message: string) {
    this.send('error', `ERROR: ${message}`);
  }


  private send(level: string, message: string) {
    this.system.events.emit(categories.logger, level, message);
  }

}
