import System from './System';
import categories from './dict/categories';

export default class LogPublisher {
  readonly system: System;


  constructor(system: System) {
    this.system = system;
  }

  async debug(message: string) {
    await this.send('debug', message);
  }

  async verbose(message: string) {
    await this.send('verbose', message);
  }

  async info(message: string) {
    await this.send('info', message);
  }

  async warn(message: string) {
    await this.send('warn', message);
  }

  async error(message: string) {
    await this.send('error', `ERROR: ${message}`);
  }

  async fatal(message: string) {

    await this.send('fatal', `ERROR: ${message}`);

    // TODO: review - is exit really need ?

    process.exit(2);
  }

  private async send(level: string, message: string) {
    await this.system.messenger.emit(categories.logger, level, message);
  }

}
