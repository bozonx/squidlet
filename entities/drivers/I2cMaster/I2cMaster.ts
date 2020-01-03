import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {hexNumToString, hexStringToHexNum} from 'system/lib/binaryHelpers';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from 'system/lib/base/MasterSlaveBaseNodeDriver';
import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import {ImpulseInput} from '../ImpulseInput/ImpulseInput';


export interface I2cMasterDriverProps extends MasterSlaveBaseProps {
  busNum: number;
  // it can be i2c address as a string like '0x5a' or number equivalent - 90
  address: string | number;
}


export class I2cMaster extends MasterSlaveBaseNodeDriver<I2cMasterDriverProps> {
  private impulseInput?: ImpulseInput;
  private impulseHandlerIndex?: number;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMasterIo(): I2cMasterIo {
    return this.depsInstances.i2cMaster;
  }


  init = async () => {
    super.init();

    if (this.props.int) {
      this.impulseInput = await this.context.getSubDriver<ImpulseInput>(
        'ImpulseInput',
        this.props.int || {}
      );
    }

    this.depsInstances.i2cMaster = this.context.getIo('I2cMaster');

    if (typeof this.props.address === 'string') {
      this.addressHex = hexStringToHexNum(String(this.props.address));
    }
    else if (typeof this.props.address === 'number') {
      this.addressHex = this.props.address;
    }
  }


  write(data: Uint8Array): Promise<void> {
    this.log.debug(
      `I2cMaster driver write. busNum ${this.props.busNum}, ` +
      `addr: ${hexNumToString(this.addressHex)}, data: ${JSON.stringify(data)}`
    );

    return this.sender.send<void>(
      undefined,
      (): Promise<void> => {
        return this.i2cMasterIo.i2cWriteDevice(this.props.busNum, this.addressHex, data);
      }
    );
  }

  async read(length: number): Promise<Uint8Array> {
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      undefined,
      (): Promise<Uint8Array> => {
        return this.i2cMasterIo.i2cReadDevice(this.props.busNum, this.addressHex, length);
      }
    );

    this.log.debug(
      `I2cMaster driver read. busNum ${this.props.busNum}, ` +
      `addrHex: ${hexNumToString(this.addressHex)}, result: ${JSON.stringify(result)}`
    );

    return result;
  }

  startFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.startFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseHandlerIndex = this.impulseInput.onChange(this.pollAllFunctions);

      return;
    }

    super.startFeedback();
  }

  stopFeedBack() {
    if (this.props.feedback === 'int') {
      if (!this.impulseHandlerIndex) return;

      this.impulseInput && this.impulseInput.removeListener(this.impulseHandlerIndex);

      return;
    }

    super.stopFeedBack();
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
