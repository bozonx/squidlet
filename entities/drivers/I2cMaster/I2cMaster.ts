import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import I2cMasterDev from 'system/interfaces/io/I2cMasterDev';
import { addFirstItemUint8Arr } from 'system/helpers/collections';
import DriverBase from 'system/baseDrivers/DriverBase';
import {DATA_ADDRESS_LENGTH} from 'system/dict/constants';


// TODO: does it really need?


export interface I2cMasterProps {
  bus: number | string;
}

export interface I2cMasterInstanceProps {
  bus: string;
}


export class I2cMaster extends DriverBase<I2cMasterInstanceProps> {
  private get i2cMasterDev(): I2cMasterDev {
    return this.depsInstances.i2cMaster as any;
  }


  protected willInit = async () => {
    this.depsInstances.i2cMaster = this.env.getIo('I2cMaster');
  }


  /**
   * Read once from bus.
   * if data address is defined then it will write an empty command before read
   * and code on other side cat prepare data to send.
   */
  read = async(addressHex: number, dataAddressHex: number | undefined, length: number): Promise<Uint8Array> => {
    if (typeof dataAddressHex !== 'undefined') {
      await this.write(addressHex, dataAddressHex);
    }

    // read from bus
    return this.i2cMasterDev.readFrom(this.props.bus, addressHex, length);
  }

  write = async (addressHex: number, dataAddressHex?: number, data?: Uint8Array): Promise<void> => {
    let dataToWrite = data;

    if (typeof dataAddressHex !== 'undefined' && typeof data === 'undefined') {
      dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
    }
    else if (typeof dataAddressHex !== 'undefined' && typeof data !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddressHex);
    }

    // if (typeof dataAddressHex === 'undefined' && typeof data !== 'undefined') dataToWrite = data
    // if (typeof dataAddressHex === 'undefined' && typeof data === 'undefined') dataToWrite = undefined;

    // TODO: выяснить поддерживается ли запись без данных

    //await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);

    await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite || new Uint8Array(0));

    // try {
    //   await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite || new Uint8Array(0));
    //
    //   console.log('==== i2c master SUCCESS', addressHex, dataAddressHex, data);
    // }
    // catch (err) {
    //   console.log('==== i2c master ERROR', addressHex, dataAddressHex, data);
    //
    //   throw err;
    // }

  }

  /**
   * Write and read from the same data address.
   */
  request = async(addressHex: number, dataAddressHex: number | undefined, dataToSend: Uint8Array | undefined, readLength: number): Promise<Uint8Array> => {
    await this.write(addressHex, dataAddressHex, dataToSend);

    return this.read(addressHex, dataAddressHex, readLength);
  }

  // /**
  //  * Write only a dataAddress to bus
  //  */
  // writeEmpty(addressHex: number, dataAddressHex: number): Promise<void> {
  //   const dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
  //
  //   dataToWrite[0] = dataAddressHex;
  //
  //   return this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  // }

  // /**
  //  * Write only a dataAddress or nothing to bus
  //  */
  // writeEmpty(addressHex: number, dataAddress: number | undefined): Promise<void> {
  //   // send nothing
  //   if (typeof dataAddress === 'undefined') {
  //     return this.i2cMasterDev.writeTo(this.props.bus, addressHex);
  //   }
  //
  //   // send only a data address
  //   const dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
  //
  //   dataToWrite[0] = dataAddress;
  //
  //   return this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  // }

  // protected validateProps = (props: I2cMasterDriverProps): string | undefined => {
  //   return;
  // }

}


export default class Factory extends DriverFactoryBase<I2cMaster> {
  protected instanceByPropName = 'bus';
  protected DriverClass = I2cMaster;

  // TODO: review
  async getInstance(props: I2cMasterProps): Promise<I2cMaster> {
    const resolvedProps = (typeof props.bus === 'undefined') ? {} : { bus: String(props.bus) };

    return super.getInstance(resolvedProps);
  }

}
