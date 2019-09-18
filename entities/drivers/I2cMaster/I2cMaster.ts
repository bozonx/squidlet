import DriverFactoryBase from 'system/base/DriverFactoryBase';
import I2cMasterIo from 'system/interfaces/io/I2cMasterIo';
import { addFirstItemUint8Arr } from 'system/lib/binaryHelpers';
import DriverBase from 'system/base/DriverBase';
import {FUNCTION_NUMBER_LENGTH} from 'system/constants';


export interface I2cMasterProps {
  busNum: number;
}


export class I2cMaster extends DriverBase<I2cMasterProps> {
  private get i2cMasterIo(): I2cMasterIo {
    return this.depsInstances.i2cMaster;
  }


  protected willInit = async () => {
    this.depsInstances.i2cMaster = this.context.getIo('I2cMaster');
  }


  /**
   * Read once from bus.
   * if data address is defined then it will write an empty command before read
   * and code on other side can prepare data to send.
   */
  read = async(addressHex: number, functionHex: number | undefined, length: number): Promise<Uint8Array> => {
    if (typeof functionHex !== 'undefined') {
      await this.write(addressHex, functionHex);
    }

    // read from bus
    return this.i2cMasterIo.readFrom(this.props.busNum, addressHex, length);
  }

  /**
   * Write to the bus.
   * @param addressHex - address of slave.
   * @param functionHex - function number - one byte
   * @param data - data to write
   */
  write = async (addressHex: number, functionHex?: number, data?: Uint8Array): Promise<void> => {
    let dataToWrite = data || new Uint8Array(0);

    if (typeof functionHex !== 'undefined' && typeof data === 'undefined') {
      // only function number
      dataToWrite = new Uint8Array(FUNCTION_NUMBER_LENGTH);
    }
    else if (typeof functionHex !== 'undefined' && typeof data !== 'undefined') {
      // function number and data
      dataToWrite = addFirstItemUint8Arr(data, functionHex);
    }

    // TODO: выяснить поддерживается ли запись без данных

    await this.i2cMasterIo.writeTo(this.props.busNum, addressHex, dataToWrite);
  }

  /**
   * Write and read from the same data address.
   */
  request = async(addressHex: number, functionHex: number | undefined, dataToSend: Uint8Array | undefined, readLength: number): Promise<Uint8Array> => {
    await this.write(addressHex, functionHex, dataToSend);

    return this.read(addressHex, functionHex, readLength);
  }

}


export default class Factory extends DriverFactoryBase<I2cMaster> {
  protected instanceByPropName = 'busNum';
  protected DriverClass = I2cMaster;

  // async getInstance(props: I2cMasterProps): Promise<I2cMaster> {
  //   const resolvedProps = (typeof props.busNum === 'undefined') ? {} : { busNum: String(props.busNum) };
  //
  //   return super.getInstance(resolvedProps);
  // }
}
