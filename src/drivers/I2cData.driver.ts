import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cDriver from './I2cMaster.driver';

// TODO: remove

export default class I2cData {
  //readonly blockLength: number = 32;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly i2cDriver: I2cDriver;
  private readonly eventName: string = 'data';
  // its "7E"
  private readonly dataAddr: number = 126;

  constructor(drivers: Drivers) {
    this.drivers = drivers;
    this.i2cDriver = this.drivers.getDriver('I2c');
  }

  write(bus: string, address: string, data: Uint8Array): Promise<void> {
    // TODO: разбить данные на блоки и отослать поочереди - ставить в конец очереди
  }

  listen(bus: string, address: string, handler: (data: Uint8Array) => void) {
    // TODO: склеить блоки. См в заголовке есть ли ещё данные
  }

  unlisten(bus: string, address: string, handler: (data: Uint8Array) => void) {

    // TODO: использовать bus и address

    this.events.removeListener(this.eventName, handler);
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}
