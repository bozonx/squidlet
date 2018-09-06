import * as EventEmitter from 'events';

import I2cSlaveDev from '../../app/interfaces/dev/I2cSlave.dev';
import DriverEnv from '../../app/DriverEnv';
import DriverFactoryBase from '../../app/DriverFactoryBase';
import { addFirstItemUint8Arr, withoutFirstItemUint8Arr } from '../../helpers/helpers';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
//import DriverProps from '../../app/interfaces/DriverProps';


const NO_DATA_ADDRESS = 'null';
const REGISTER_LENGTH = 1;

type SlaveHandler = (error: Error | null, data?: Uint8Array) => void;


export class I2cSlaveDriver {
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: number;
  private readonly i2cSlaveDev: I2cSlaveDev;

  constructor(props: EntityProps, env: DriverEnv, bus: string | number) {
    this.env = env;
    this.bus = (Number.isInteger(bus as any))
      ? bus as number
      : parseInt(bus as any);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    const i2cSlaveDev = this.env.getDriver<DriverFactoryBase>('I2cSlave.dev');

    this.i2cSlaveDev = i2cSlaveDev.getInstance(this.bus) as I2cSlaveDev;
    // listen all the income data
    this.i2cSlaveDev.listenIncome(this.handleIncomeData);
  }

  // TODO: поддержка int

  async write(i2cAddress: undefined, dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    await this.i2cSlaveDev.send(dataToWrite);

    // TODO: !!!! ??? сделать очередь чтобы мастер считал при полинге
    // TODO: !!!! ??? последние данные будут удаляться или висеть ???
  }

  async read(i2cAddress: undefined, dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const handler = (data: Uint8Array): void => {
        if (typeof dataAddress === 'undefined') {
          resolve(data);
        }
        else {
          // not our data
          if (data[0] !== dataAddress) return;

          resolve(withoutFirstItemUint8Arr(data));
        }

        this.i2cSlaveDev.removeListener(handler);
      };

      this.i2cSlaveDev.listenIncome(handler);

      // TODO: по таймауту 60 сек отписаться и поднять ошибку - reject

    });
  }

  listenIncome(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handler: SlaveHandler
  ): void {

    // TODO: что делать с lenght ???? наверное проверить длинну
    // TODO: если слушаем data address - то возвращать ошибку что дина не совпадает
    // TODO: если слушаем все данные ? то наверное не писать ошибку ???

    const id = this.generateId(dataAddress);

    this.events.addListener(id, handler);
  }

  removeListener(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handler: SlaveHandler
  ): void {

    // TODO: test

    const id = this.generateId(dataAddress);

    this.events.removeListener(id, handler);
  }

  private handleIncomeData = (data: Uint8Array) => {
    // emit handler for all the income data any way
    this.events.emit(NO_DATA_ADDRESS, null, data);

    if (!data.length) return;

    const id = this.generateId(data[0]);

    // emit handler of data address
    if (data.length > REGISTER_LENGTH) {
      this.events.emit(id, null, withoutFirstItemUint8Arr(data));
    }
    else if (data.length === REGISTER_LENGTH) {
      this.events.emit(id, null, undefined);
    }
  }

  private generateId(dataAddress: number | undefined): string {
    if (typeof dataAddress === 'undefined') return NO_DATA_ADDRESS;

    return dataAddress.toString();
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
      bus: string | number,
    ): I2cSlaveDriver } = I2cSlaveDriver;
  private instances: {[index: string]: I2cSlaveDriver} = {};

  getInstance(bus: string) {
    this.instances[bus] = super.getInstance(bus) as I2cSlaveDriver;

    return this.instances[bus];
  }
}
