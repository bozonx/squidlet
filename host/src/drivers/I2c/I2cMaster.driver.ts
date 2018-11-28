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
    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.dev');
  }


  /**
   * Read once from bus.
   * if data address is defined then it will write an empty command before read
   * and code on other side cat prepare data to send
   */
  async read(addressHex: number, dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    if (typeof dataAddress !== 'undefined') {
      await this.writeEmpty(addressHex, dataAddress);
    }

    // read from bus
    return this.i2cMasterDev.readFrom(this.props.bus, addressHex, length);
  }

  async write(addressHex: number, dataAddress: number | undefined, data: Uint8Array): Promise<void> {

    console.log(88888888, this.props, addressHex, dataAddress, data);

    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  }

  /**
   * Write only a dataAddress to bus
   */
  writeEmpty(addressHex: number, dataAddress: number): Promise<void> {
    const dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);

    dataToWrite[0] = dataAddress;

    return this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  }

  /**
   * Write and read from the same data address.
   */
  async request(addressHex: number, dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    await this.write(addressHex, dataAddress, dataToSend);

    return this.read(addressHex, dataAddress, readLength);
  }

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
