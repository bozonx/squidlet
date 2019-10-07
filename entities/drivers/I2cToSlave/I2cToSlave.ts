import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {hexStringToHexNum} from 'system/lib/binaryHelpers';
import {omitObj} from 'system/lib/objects';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from 'system/lib/base/MasterSlaveBaseNodeDriver';

import {I2cMaster} from '../I2cMaster/I2cMaster';
import {ImpulseInput} from '../ImpulseInput/ImpulseInput';


export interface I2cToSlaveDriverProps extends MasterSlaveBaseProps {
  busNum: number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
}


export class I2cToSlave extends MasterSlaveBaseNodeDriver<I2cToSlaveDriverProps> {
  private impulseInput?: ImpulseInput;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMaster {
    return this.depsInstances.i2cMaster;
  }


  init = async () => {
    if (this.props.int) {
      this.impulseInput = await this.context.getSubDriver('ImpulseInput', this.props.int || {});
    }

    this.depsInstances.i2cMaster = await this.context.getSubDriver(
      'I2cMaster',
      omitObj(
        this.props,
        'address',
        'int',
        'poll',
        'feedback',
        'pollInterval'
      )
    );

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }


  async write(functionStr?: string | number, data?: Uint8Array): Promise<void> {
    const functionHex: number | undefined = this.makeFunctionHex(functionStr);
    const senderId = this.makeSenderId(functionStr, 'write');

    await this.sender.send<void>(senderId, this.i2cMaster.write, this.addressHex, functionHex, data);
  }

  async read(functionStr?: string | number, length?: number): Promise<Uint8Array> {
    const functionHex: number | undefined = this.makeFunctionHex(functionStr);
    const resolvedLength: number = this.resolveReadLength(functionStr, length);
    const senderId = this.makeSenderId(functionStr, 'read', resolvedLength);
    // send data and wait
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      functionHex,
      resolvedLength
    );

    this.updateLastPollData(functionStr, result);

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async request(
    functionStr?: string | number,
    dataToSend?: Uint8Array,
    readLength?: number
  ): Promise<Uint8Array> {
    const functionHex: number | undefined = this.makeFunctionHex(functionStr);
    const resolvedLength: number = this.resolveReadLength(functionStr, readLength);
    const senderId = this.makeSenderId(functionStr, 'request', resolvedLength);
    // make request
    // TODO: why not request method ???
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.request,
      this.addressHex,
      functionHex,
      dataToSend,
      resolvedLength
    );

    this.updateLastPollData(functionStr, result);

    return result;
  }

  /**
   * Read data once and rise an data event
   */
  protected async doPoll(functionStr?: string | number): Promise<Uint8Array> {
    const functionHex: number | undefined = this.makeFunctionHex(functionStr);
    const resolvedLength: number = this.resolveReadLength(functionStr);
    const senderId = this.makeSenderId(functionStr, 'doPoll');

    const data: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      functionHex,
      resolvedLength
    );

    this.updateLastPollData(functionStr, data);

    return data;
  }

  protected setupFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.setupFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseInput.addListener(this.pollAllFunctionNumbers);
    }
    // start polling if feedback is poll
    this.startPolls();

    // else don't use feedback at all
  }


  private resolveReadLength(functionStr?: string | number, readLength?: number): number {
    if (typeof readLength !== 'undefined') {
      return readLength;
    }

    const pollProps = this.getPollProps(functionStr);

    if (!pollProps) {
      throw new Error(`Can't find poll props of dataAddress "${functionStr}"`);
    }
    else if (!pollProps.dataLength) {
      throw new Error(`I2cToSlaveDriver: Can't resolve length of data of dataAddress "${functionStr}"`);
    }

    return pollProps.dataLength;
  }

  private makeSenderId(functionStr: string | number | undefined, method: string, ...params: (string | number)[]) {
    const resolvedDataAddr: string = this.resolvefunctionStr(functionStr);

    return [this.props.busNum, this.props.address, resolvedDataAddr, method, ...params].join();
  }


  protected validateProps = (props: I2cToSlaveDriverProps): string | undefined => {

    // TODO; validate poll props

    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlave, I2cToSlaveDriverProps> {
  protected SubDriverClass = I2cToSlave;
  protected instanceId = (props: I2cToSlaveDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
