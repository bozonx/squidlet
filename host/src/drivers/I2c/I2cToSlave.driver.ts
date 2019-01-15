import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import {hexStringToHexNum} from '../../helpers/binaryHelpers';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {omit} from '../../helpers/lodashLike';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';
import {ImpulseInputDriver} from '../Binary/ImpulseInput.driver';


export interface I2cToSlaveDriverProps extends MasterSlaveBaseProps {
  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
}


export class I2cToSlaveDriver extends MasterSlaveBaseNodeDriver<I2cToSlaveDriverProps> {
  private impulseInput?: ImpulseInputDriver;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    if (this.props.int) {
      this.impulseInput = await getDriverDep('ImpulseInput.driver')
        .getInstance(this.props.int || {});
    }

    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.driver')
      .getInstance(omit(this.props,
        'address', 'int', 'poll', 'feedback', 'pollInterval'
      ));

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }


  async write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const senderId = this.makeSenderId(dataAddressStr, 'write');

    await this.sender.send<void>(senderId, (): Promise<void> => {
      return this.i2cMaster.write(this.addressHex, dataAddressHex, data);
    });
  }

  async read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array> {
    const dataAddressHex: number | undefined = this.makeDataAddrHex(dataAddressStr);
    const resolvedLength: number = this.resolveReadLength(dataAddressStr, length);
    const senderId = this.makeSenderId(dataAddressStr, 'read', resolvedLength);
    // send data and wait
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.read(this.addressHex, dataAddressHex, resolvedLength);
      });

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
    const result: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.request(this.addressHex, dataAddressHex, dataToSend, resolvedLength);
      });

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

    const data: Uint8Array = await this.sender
      .send<Uint8Array>(senderId, (): Promise<Uint8Array> => {
        return this.i2cMaster.read(this.addressHex, dataAddressHex, resolvedLength);
      });

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

    // TODO: поддержка если dataAddress = undefined - взять props без dataAddress

    if (typeof dataAddressStr === 'undefined') {
      if (typeof readLength === 'undefined') {
        throw new Error(`I2cToSlaveDriver: You should specify dataAddressStr or readLength`);
      }

      return readLength;
    }
    else if (typeof readLength !== 'undefined') {
      return readLength;
    }

    // else if specified dataAddressStr and not specified readLength
    const pollProps = this.getPollProps(dataAddressStr);

    if (!pollProps) {
      throw new Error(`Can't find poll props of dataAddress "${dataAddressStr}"`);
    }
    else if (typeof pollProps.dataLength === 'undefined') {
      throw new Error(`Length param is not specified on poll props "${pollProps}"`);
    }

    return pollProps.dataLength;
  }

  private makeSenderId(dataAddressStr: string | number | undefined, method: string, ...params: (string | number)[]) {
    const dataAddrStr: string = this.resolveDataAddressStr(dataAddressStr);

    return [this.props.bus, this.props.address, dataAddrStr, method, ...params].join();
  }


  protected validateProps = (props: I2cToSlaveDriverProps): string | undefined => {

    // TODO; validate

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlaveDriver> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus || 'default'}-${props.address}`;
  }
  protected DriverClass = I2cToSlaveDriver;
}
