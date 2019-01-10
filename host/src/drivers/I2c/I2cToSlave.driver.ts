import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import {hexStringToHexNum} from '../../helpers/binaryHelpers';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {omit} from '../../helpers/lodashLike';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';


export interface I2cNodeDriverProps extends MasterSlaveBaseProps {
  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;

  // TODO: указать длины для data adresses
}


export class I2cToSlaveDriver extends MasterSlaveBaseNodeDriver<I2cNodeDriverProps> {
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.driver')
      .getInstance(omit(this.props,
        'int', 'pollDataLength', 'pollDataAddress', 'address', 'feedback', 'pollInterval'
      ));

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }

  // /**
  //  * Write only a dataAddress to bus
  //  */
  // async writeEmpty(dataAddress: number): Promise<void> {
  //
  //   // TODO: наверное не нужно - использоваь write без данных
  //
  //   const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, writeEmpty(${this.dataAddressToString(dataAddress)})`;
  //
  //   await this.sender.send<void>(senderId, (): Promise<void> => {
  //     return this.i2cMaster.writeEmpty(this.addressHex, dataAddress);
  //   });
  // }

  async write(dataAddress?: number, data?: Uint8Array): Promise<void> {
    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, write(${this.dataAddressToString(dataAddress)}})`;

    await this.sender.send<void>(senderId, (): Promise<void> => {
      return this.i2cMaster.write(this.addressHex, dataAddress, data);
    });
  }

  async read(dataAddress: number | undefined, length: number): Promise<Uint8Array> {

    // TODO: length is optional - try to get from props

    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, read(${this.dataAddressToString(dataAddress)}, ${length})`;
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.read(this.addressHex, dataAddress, length);
      });

    // update last poll data if data address the same
    if (this.props.feedback && dataAddress === this.props.pollDataAddress) {
      this.updateLastPollData(result);
    }

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async request(dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {

    // TODO: review

    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, request(${this.dataAddressToString(dataAddress)}, ${readLength})`;
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.request(this.addressHex, dataAddress, dataToSend, readLength);
      });

    // update last poll data if data address the same
    if (this.props.feedback && dataAddress === this.props.pollDataAddress) {
      this.updateLastPollData(result);
    }

    return result;
  }

  /**
   * Read data once and rise an data event
   */
  protected doPoll = async (): Promise<Uint8Array> => {
    let data: Uint8Array;

    try {
      // TODO: use sender if int poll type is used
      data = await this.i2cMaster.read(this.addressHex, this.pollDataAddressHex, this.props.pollDataLength);
    }
    catch (err) {
      const msg = `I2cNode.driver Poll error of bus "${this.props.bus}",
           address "${this.props.address}", dataAddress "${this.props.pollDataAddress}": ${String(err)}`;

      // emit error to poll error channel
      this.pollErrorEvents.emit(msg);

      throw new Error(msg);
    }

    this.updateLastPollData(data);

    return data;
  }


  protected validateProps = (props: I2cNodeDriverProps): string | undefined => {

    // TODO; validate

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlaveDriver> {

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
  protected DriverClass = I2cToSlaveDriver;
}
