import I2cSlaveIo from 'interfaces/io/I2cSlaveIo';
import DriverFactoryBase from 'base/DriverFactoryBase';
import { addFirstItemUint8Arr, withoutFirstItemUint8Arr } from 'lib/binaryHelpers';
import DriverBase from 'base/DriverBase';
import IndexedEventEmitter from 'lib/IndexedEventEmitter';


// TODO: don't use null
const NO_DATA_ADDRESS = 'null';
const REGISTER_LENGTH = 1;

// TODO: don't use null
type SlaveHandler = (error: Error | null, data?: Uint8Array) => void;

interface I2cSlaveProps {
  bus: number;
}


export class I2cSlave extends DriverBase<I2cSlaveProps> {
  private readonly events = new IndexedEventEmitter<SlaveHandler>();

  private get i2cSlaveDev(): I2cSlaveIo {
    return this.depsInstances.i2cSlave as any;
  }


  init = async () => {
    this.depsInstances.i2cSlave = this.context.getIo('I2cSlave');
  }

  protected didMount = async () => {
    // listen all the income data
    await this.i2cSlaveDev.listenIncome(this.props.bus, this.handleIncomeData);
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

        this.i2cSlaveDev.removeListener(this.props.bus, handler)
          .catch(reject);
      };

      this.i2cSlaveDev.listenIncome(this.props.bus, handler)
        .catch(reject);

      // TODO: по таймауту 60 сек отписаться и поднять ошибку - reject

    });
  }

  listenIncome(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handler: SlaveHandler
  ): number {

    // TODO: что делать с lenght ???? наверное проверить длинну
    // TODO: если слушаем data address - то возвращать ошибку что дина не совпадает
    // TODO: если слушаем все данные ? то наверное не писать ошибку ???

    const id = this.generateId(dataAddress);

    return this.events.addListener(id, handler);
  }

  removeListener(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handlerIndex: number
  ): void {

    // TODO: test
    // TODO: length - для чего ???

    const id = this.generateId(dataAddress);

    this.events.removeListener(id, handlerIndex);
  }

  private handleIncomeData = (data: Uint8Array) => {
    // emit handler for all the income data any way
    // TODO: don't use null
    this.events.emit(NO_DATA_ADDRESS, null, data);

    if (!data.length) return;

    const id = this.generateId(data[0]);

    // emit handler of data address
    if (data.length > REGISTER_LENGTH) {
      // TODO: don't use null
      this.events.emit(id, null, withoutFirstItemUint8Arr(data));
    }
    else if (data.length === REGISTER_LENGTH) {
      // TODO: don't use null
      this.events.emit(id, null, undefined);
    }
  }

  private generateId(dataAddress: number | undefined): string {
    if (typeof dataAddress === 'undefined') return NO_DATA_ADDRESS;

    return dataAddress.toString();
  }

  protected validateProps = (props: I2cSlaveProps): string | undefined => {
    if (Number.isInteger(props.bus)) return `Incorrect type bus number "${props.bus}"`;
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cSlave, I2cSlaveProps> {
  protected SubDriverClass = I2cSlave;
  protected instanceId = (props: I2cSlaveProps) => String(props.bus);
}
