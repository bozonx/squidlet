// See interface in squidlet/host/src/app/interfaces/dev/I2cSlave.dev.ts

import DriverFactoryBase from '../../../host/src/app/DriverFactoryBase';
import DriverEnv from '../../../host/src/app/DriverEnv';
//import DriverProps from '../../../host/src/app/interfaces/DriverProps';


// TODO: иснтанс не нужен. инстансы i2c-bus можно хранить в модуле


export class I2cSlaveDev {
  constructor(driverEnv: DriverEnv, driverProps: DriverProps, bus: number) {
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
      driverEnv: DriverEnv,
      driverProps: DriverProps,
      bus: number
    ): I2cSlaveDev } = I2cSlaveDev;
}
