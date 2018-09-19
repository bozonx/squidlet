import * as EventEmitter from 'events';

import I2cSlave from '../../app/interfaces/dev/I2cSlave';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import { addFirstItemUint8Arr, withoutFirstItemUint8Arr } from '../../helpers/helpers';
import {DriverBaseProps} from '../../app/entities/DriverBase';
import DriverBase from '../../app/entities/DriverBase';
import EntityDefinition from '../../app/interfaces/EntityDefinition';
import Env from '../../app/interfaces/Env';


const NO_DATA_ADDRESS = 'null';
const REGISTER_LENGTH = 1;

type SlaveHandler = (error: Error | null, data?: Uint8Array) => void;

interface I2cSlaveDriverProps extends DriverBaseProps {
  bus: number;
}


export class I2cSlaveDriver extends DriverBase<I2cSlaveDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly i2cSlaveDev: I2cSlave;

  constructor(definition: EntityDefinition, env: Env) {
    super(definition, env);

    // TODO: call from base init
    this.validateProps(this.props);

    // TODO: рефакторить - нужно как-то убедиться что он есть. Либо создать локальные свойства класса
    this.i2cSlaveDev = this.getDriverDep<I2cSlave>('I2cSlave.dev');
    // listen all the income data
    this.i2cSlaveDev.listenIncome(this.props.bus, this.handleIncomeData);
  }

  // TODO: поддержка int

  async write(i2cAddress: undefined, dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    await this.i2cSlaveDev.send(this.props.bus, dataToWrite);

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

        this.i2cSlaveDev.removeListener(this.props.bus, handler);
      };

      this.i2cSlaveDev.listenIncome(this.props.bus, handler);

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

  private validateProps(props: I2cSlaveDriverProps) {
    if (Number.isInteger(props.bus)) throw new Error(`Incorrect type bus number "${props.bus}"`);
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);
  }

}


export default class I2cSlaveFactory extends DriverFactoryBase<I2cSlaveDriver, I2cSlaveDriverProps> {
  protected instanceIdName: string = 'bus';
  protected DriverClass = I2cSlaveDriver;
}
