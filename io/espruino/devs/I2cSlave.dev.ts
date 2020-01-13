import DriverEnv from '../../../host/src/app/entities/DriverEnv';


// TODO: иснтанс не нужен. инстансы i2c-bus можно хранить в модуле


export default class I2cSlaveDev {
  constructor(props: {[index: string]: any;}, env: DriverEnv, bus: number) {
  }

  async send(bus: string, data: Uint8Array): Promise<void> {
    // TODO: отправляем данные мастеру, можно указать длину
  }

  listenIncome(bus: string, handler: (data: Uint8Array) => void): void {
    // TODO: слушать все входящие запросы
    // TODO: ошбку наверное тоже надо отдавать ???
    // TODO: дается длинна и можно считать данные этой длинны и поднять хэндлер
  }

  removeListener(bus: string, handler: (data: Uint8Array) => void): void {

  }

}
