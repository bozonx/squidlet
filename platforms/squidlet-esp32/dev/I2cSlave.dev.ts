// See interface in squidlet/host/src/app/interfaces/dev/I2cSlave.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import Drivers from '../../../host/src/app/Drivers';


// TODO: иснтанс не нужен. инстансы i2c-bus можно хранить в модуле


export class I2cSlaveDev {
  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: number) {
  }

  async send(data: Uint8Array): Promise<void> {
    // TODO: отправляем данные мастеру, можно указать длину
  }

  listenIncome(handler: (data: Uint8Array) => void): void {
    // TODO: слушать все входящие запросы
    // TODO: ошбку наверное тоже надо отдавать ???
    // TODO: дается длинна и можно считать данные этой длинны и поднять хэндлер
  }

  removeListener(handler: (data: Uint8Array) => void): void {

  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: number
    ): I2cSlaveDev } = I2cSlaveDev;
}
