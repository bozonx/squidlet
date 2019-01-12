import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import {hexStringToHexNum} from '../../helpers/binaryHelpers';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {omit} from '../../helpers/lodashLike';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';


export interface I2cToSlaveDriverProps extends MasterSlaveBaseProps {
  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;

  // TODO: указать длины для data adresses
}


export class I2cToSlaveDriver extends MasterSlaveBaseNodeDriver<I2cToSlaveDriverProps> {
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.driver')
      .getInstance(omit(this.props,
        // TODO: review
        'int', 'pollDataLength', 'pollDataAddress', 'address', 'feedback', 'pollInterval'
      ));

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }

  async write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void> {
    const dataAddress: number | undefined = (typeof dataAddressStr === 'undefined')
      ? undefined :
      this.makeDataAddressHexNum(dataAddressStr);
    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, write(${this.dataAddressToString(dataAddress)}})`;

    await this.sender.send<void>(senderId, (): Promise<void> => {
      return this.i2cMaster.write(this.addressHex, dataAddress, data);
    });
  }

  async read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array> {
    const dataAddress: number | undefined = (typeof dataAddressStr === 'undefined')
      ? undefined :
      this.makeDataAddressHexNum(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(length);
    // TODO: review - make method
    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, read(${this.dataAddressToString(dataAddress)}, ${resolvedLength})`;
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.read(this.addressHex, dataAddress, resolvedLength);
      });
    const isItPolingDataAddr: boolean = typeof dataAddress !== 'undefined'
      && this.props.feedback
      && this.props.poll.map((item) => item.dataAddress).includes(dataAddress);

    // update last poll data if data address the same
    if (typeof dataAddress !== 'undefined' && isItPolingDataAddr) {
      this.updateLastPollData(dataAddress, result);
    }

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async request(dataAddressStr?: string | number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array> {
    const dataAddress: number | undefined = (typeof dataAddressStr === 'undefined')
      ? undefined :
      this.makeDataAddressHexNum(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(readLength);
    const senderId = `bus: ${this.props.bus}, addr: ${this.props.address}, request(${this.dataAddressToString(dataAddress)}, ${resolvedLength})`;
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.request(this.addressHex, dataAddress, dataToSend, resolvedLength);
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
  protected doPoll = async (dataAddressStr: string | number): Promise<Uint8Array> => {
    let data: Uint8Array;

    // TODO: reveiw

    try {
      // TODO: use sender if int poll type is used
      data = await this.i2cMaster.read(this.addressHex, this.pollDataAddressHex, this.props.pollDataLength);
    }
    catch (err) {
      const msg = `I2cToSlaveDriver: Poll error of bus "${this.props.bus}",
           address "${this.props.address}", dataAddress "${this.props.pollDataAddress}": ${String(err)}`;

      // emit error to poll error channel
      this.pollErrorEvents.emit(dataAddressStr, new Error(msg));

      throw new Error(msg);
    }

    this.updateLastPollData(data);

    return data;
  }

  private resolveReadLength(readLength?: number): number {
    if (typeof readLength !== 'undefined') return readLength;

    // TODO: resolve on props

    throw new Error(`I2cToSlaveDriver: You have to specify a length param to read or request methods`);
  }


  protected validateProps = (props: I2cToSlaveDriverProps): string | undefined => {

    // TODO; validate

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlaveDriver> {
  protected DriverClass = I2cToSlaveDriver;

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
}
