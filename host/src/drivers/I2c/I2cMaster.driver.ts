import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { addFirstItemUint8Arr } from '../../helpers/helpers';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';


const DATA_ADDRESS_LENGTH = 1;

export interface I2cMasterDriverProps {
  bus: number | string;
}

export interface I2cMasterDriverInstanceProps {
  bus: string;
}


export class I2cMasterDriver extends DriverBase<I2cMasterDriverInstanceProps> {
  private get i2cMasterDev(): I2cMaster {
    return this.depsInstances.i2cMaster as I2cMaster;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    //this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.dev');
    this.depsInstances.i2cMaster = this.env.getDev('I2cMaster');
  }


  /**
   * Read once from bus.
   * if data address is defined then it will write an empty command before read
   * and code on other side cat prepare data to send.
   */
  async read(addressHex: number, dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    if (typeof dataAddress !== 'undefined') {
      await this.write(addressHex, dataAddress);
    }

    // read from bus
    return this.i2cMasterDev.readFrom(this.props.bus, addressHex, length);
  }

  async write(addressHex: number, dataAddress?: number, data?: Uint8Array): Promise<void> {
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined' && typeof data === 'undefined') {
      dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
    }
    else if (typeof dataAddress !== 'undefined' && typeof data !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    // if (typeof dataAddress === 'undefined' && typeof data !== 'undefined') dataToWrite = data
    // if (typeof dataAddress === 'undefined' && typeof data === 'undefined') dataToWrite = undefined;

    // TODO: выяснить поддерживается ли запись без данных

    //await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
    await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite || new Uint8Array(0));
  }

  /**
   * Write and read from the same data address.
   */
  async request(addressHex: number, dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    await this.write(addressHex, dataAddress, dataToSend);

    return this.read(addressHex, dataAddress, readLength);
  }

  // /**
  //  * Write only a dataAddress to bus
  //  */
  // writeEmpty(addressHex: number, dataAddress: number): Promise<void> {
  //   const dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
  //
  //   dataToWrite[0] = dataAddress;
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


export default class Factory extends DriverFactoryBase<I2cMasterDriver> {
  protected instanceByPropName = 'bus';
  protected DriverClass = I2cMasterDriver;

  async getInstance(props: I2cMasterDriverProps): Promise<I2cMasterDriver> {
    const resolvedProps = (typeof props.bus === 'undefined') ? {} : { bus: String(props.bus) };

    return super.getInstance(resolvedProps);
  }

}
