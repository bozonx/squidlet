import DriverFactoryBase from '../app/DriverFactoryBase';
import Drivers from '../app/Drivers';


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
