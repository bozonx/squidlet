import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import {hexStringToHexNum} from 'system/helpers/binaryHelpers';
import {GetDriverDep} from 'system/entities/EntityBase';
import {omit} from 'system/helpers/lodashLike';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from 'system/baseDrivers/MasterSlaveBaseNodeDriver';

import {I2cMaster} from '../I2cMaster/I2cMaster';
import {ImpulseInput} from '../ImpulseInput/ImpulseInput';


export interface I2cToSlaveDriverProps extends MasterSlaveBaseProps {
  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
}


export class I2cToSlave extends MasterSlaveBaseNodeDriver<I2cToSlaveDriverProps> {
  private impulseInput?: ImpulseInput;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMaster {
    return this.depsInstances.i2cMaster as any;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    if (this.props.int) {
      this.impulseInput = await getDriverDep('ImpulseInput')
        .getInstance(this.props.int || {});
    }

    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster')
      .getInstance(omit(this.props,
        'address', 'int', 'poll', 'feedback', 'pollInterval'
      ));

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }


  async write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const senderId = this.makeSenderId(dataAddressStr, 'write');

    await this.sender.send<void>(senderId, this.i2cMaster.write, this.addressHex, dataAddressHex, data);
  }

  async read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(dataAddressStr, length);
    const senderId = this.makeSenderId(dataAddressStr, 'read', resolvedLength);
    // send data and wait
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      dataAddressHex,
      resolvedLength
    );

    this.updateLastPollData(dataAddressStr, result);

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async request(
    dataAddressStr?: string | number,
    dataToSend?: Uint8Array,
    readLength?: number
  ): Promise<Uint8Array> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(dataAddressStr, readLength);
    const senderId = this.makeSenderId(dataAddressStr, 'request', resolvedLength);
    // make request
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.request,
      this.addressHex,
      dataAddressHex,
      dataToSend,
      resolvedLength
    );

    this.updateLastPollData(dataAddressStr, result);

    return result;
  }

  /**
   * Read data once and rise an data event
   */
  protected async doPoll(dataAddressStr?: string | number): Promise<Uint8Array> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(dataAddressStr);
    const senderId = this.makeSenderId(dataAddressStr, 'doPoll');

    const data: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      dataAddressHex,
      resolvedLength
    );

    this.updateLastPollData(dataAddressStr, data);

    return data;
  }

  protected setupFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.setupFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseInput.addListener(this.pollAllDataAddresses);
    }
    // start polling if feedback is poll
    this.startPolls();

    // else don't use feedback at all
  }


  private resolveReadLength(dataAddressStr?: string | number, readLength?: number): number {
    if (typeof readLength !== 'undefined') {
      return readLength;
    }

    const pollProps = this.getPollProps(dataAddressStr);

    if (!pollProps) {
      throw new Error(`Can't find poll props of dataAddress "${dataAddressStr}"`);
    }
    else if (!pollProps.dataLength) {
      throw new Error(`I2cToSlaveDriver: Can't resolve length of data of dataAddress "${dataAddressStr}"`);
    }

    return pollProps.dataLength;
  }

  private makeSenderId(dataAddressStr: string | number | undefined, method: string, ...params: (string | number)[]) {
    const resolvedDataAddr: string = this.resolveDataAddressStr(dataAddressStr);

    return [this.props.bus, this.props.address, resolvedDataAddr, method, ...params].join();
  }


  protected validateProps = (props: I2cToSlaveDriverProps): string | undefined => {

    // TODO; validate poll props

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlave> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus || 'default'}-${props.address}`;
  }
  protected DriverClass = I2cToSlave;
}
