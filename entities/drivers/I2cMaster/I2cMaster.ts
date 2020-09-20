import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {hexNumToString, hexStringToHexNum} from 'system/lib/binaryHelpers';
import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import DriverBase from 'system/base/DriverBase';


export interface I2cMasterDriverProps {
  busNum: number;
  // it can be i2c address as a string like '0x5a' or number equivalent - 90
  address: string | number;
}


// TODO: добавить простую очередь общую для write and read

export class I2cMaster extends DriverBase<I2cMasterDriverProps> {
  //protected sender!: Sender;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex!: number;
  private i2cMasterIo!: I2cMasterIo;


  init = async () => {
    this.i2cMasterIo = this.context.getIo('I2cMaster');

    // this.sender = new Sender(
    //   this.context.config.config.requestTimeoutSec,
    //   this.context.config.config.senderResendTimeout,
    //   this.context.log.debug,
    //   this.context.log.warn
    // );

    if (typeof this.props.address === 'string') {
      this.addressHex = hexStringToHexNum(String(this.props.address));
    }
    else if (typeof this.props.address === 'number') {
      this.addressHex = this.props.address;
    }
  }


  // TODO: add connection logic
  /*
   * * смотрим isConnected адреса
   * * если connected то делаем запрос
   * * если нет (ошибка что нет связи), то навешиваемся на onConnected, ждем 5 сек, если в течении этого времени не был отправлен запрос то rejected. (либо можно сделать повторный запрос)
   * * если запрос не прошел во всех случаях, то сразу reject - с ошибкой что нет соединения
   */
  write(data: Uint8Array): Promise<void> {
    this.log.debug(
      `I2cMaster driver write. busNum ${this.props.busNum}, ` +
      `addr: ${hexNumToString(this.addressHex)}, data: ${JSON.stringify(data)}`
    );

    return this.i2cMasterIo.i2cWriteDevice(this.props.busNum, this.addressHex, data);

    // return this.sender.send<void>(
    //   undefined,
    //   (): Promise<void> => {
    //     return this.i2cMasterIo.i2cWriteDevice(this.props.busNum, this.addressHex, data);
    //   }
    // );
  }

  // TODO: сделать такуюже connection логику что в write
  async read(length: number): Promise<Uint8Array> {
    const result: Uint8Array = await this.i2cMasterIo.i2cReadDevice(
      this.props.busNum,
      this.addressHex,
      length
    );

    // const result: Uint8Array = await this.sender.send<Uint8Array>(
    //   undefined,
    //   (): Promise<Uint8Array> => {
    //     return this.i2cMasterIo.i2cReadDevice(this.props.busNum, this.addressHex, length);
    //   }
    // );

    this.log.debug(
      `I2cMaster driver read. busNum ${this.props.busNum}, ` +
      `addrHex: ${hexNumToString(this.addressHex)}, result: ${JSON.stringify(result)}`
    );

    return result;
  }

  isConnected(): boolean {
    // TODO: add
  }

  onConnected(cb: () => void): number {
    // TODO: add
  }

  removeListener(handlerIndex: number) {
    // TODO: add
  }

  // private makeSenderId(functionHex: number | undefined, method: string, ...params: (string | number)[]) {
  //   const resolvedDataAddr: string = this.functionHexToStr(functionHex);
  //
  //   // TODO: bus num and address не нужно так как инстанс драйвера привязан к конкретному bus и address
  //   //       any way see Sender
  //   const busNum = (typeof this.props.busNum === 'undefined') ? -1 : this.props.busNum;
  //
  //   return [busNum, this.props.address, resolvedDataAddr, method, ...params].join();
  // }

}


export default class Factory extends DriverFactoryBase<I2cMaster, I2cMasterDriverProps> {
  protected SubDriverClass = I2cMaster;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${(typeof props.busNum === 'undefined') ? -1 : props.busNum}-${props.address}`;
  }
}
