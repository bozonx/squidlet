import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {hexStringToHexNum} from 'system/lib/binaryHelpers';
import {omitObj} from 'system/lib/objects';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps, PollProps} from 'system/lib/base/MasterSlaveBaseNodeDriver';
import {I2cMaster} from '../I2cMaster/I2cMaster';
import {ImpulseInput} from '../ImpulseInput/ImpulseInput';


export interface I2cToSlaveDriverProps extends MasterSlaveBaseProps {
  busNum: number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string;
}


export class I2cToSlave extends MasterSlaveBaseNodeDriver<I2cToSlaveDriverProps> {
  private impulseInput?: ImpulseInput;
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;

  private get i2cMaster(): I2cMaster {
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

    this.depsInstances.i2cMaster = await this.context.getSubDriver(
      'I2cMaster',
      omitObj(
        this.props,
        'address',
        'int',
        'poll',
        'feedback',
        'defaultPollIntervalMs'
      )
    );

    this.addressHex = hexStringToHexNum(String(this.props.address));
  }


  async write(functionHex?: number, data?: Uint8Array): Promise<void> {
    //const functionHex: number | undefined = this.makeFunctionHex(functionHex);
    const senderId = this.makeSenderId(functionHex, 'write');

    await this.sender.send<void>(senderId, this.i2cMaster.write, this.addressHex, functionHex, data);
  }

  async read(functionHex?: number, length?: number): Promise<Uint8Array> {
    //const functionHex: number | undefined = this.makeFunctionHex(functionHex);
    const resolvedLength: number = this.resolveReadLength(functionHex, length);
    const senderId = this.makeSenderId(functionHex, 'read', resolvedLength);
    // send data and wait
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      functionHex,
      resolvedLength
    );

    this.handlePoll(functionHex, result);

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async transfer(
    functionHex?: number,
    dataToSend?: Uint8Array,
    readLength?: number
  ): Promise<Uint8Array> {
    const resolvedLength: number = this.resolveReadLength(functionHex, readLength);
    const senderId = this.makeSenderId(functionHex, 'request', resolvedLength);
    // make request
    const result: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.transfer,
      this.addressHex,
      functionHex,
      dataToSend,
      resolvedLength
    );

    this.handlePoll(functionHex, result);

    return result;
  }

  // TODO: review
  startFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.startFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseInput.onChange(this.pollAllFunctions);

      return;
    }
    // start polling if feedback is poll
    this.startPollIntervals();
    // else don't use feedback at all
  }

  stopFeedBack() {
    if (this.props.feedback === 'int') {
      // TODO: remove listener
    }

    this.stopPollIntervals();
  }


  /**
   * Read data once and rise an data event
   */
  protected async doPoll(functionHex?: number): Promise<Uint8Array> {
    const resolvedLength: number = this.resolveReadLength(functionHex);
    const senderId = this.makeSenderId(functionHex, 'doPoll');

    const data: Uint8Array = await this.sender.send<Uint8Array>(
      senderId,
      this.i2cMaster.read,
      this.addressHex,
      functionHex,
      resolvedLength
    );

    this.handlePoll(functionHex, data);

    return data;
  }


  private resolveReadLength(functionHex?: number, readLength?: number): number {
    if (typeof readLength !== 'undefined') {
      return readLength;
    }

    // TODO: review
    const pollProps: PollProps | undefined = this.getPollProps(functionHex);

    if (!pollProps) {
      throw new Error(`Can't find poll props of dataAddress "${functionHex}"`);
    }
    else if (!pollProps.dataLength) {
      throw new Error(`I2cToSlaveDriver: Can't resolve length of data of dataAddress "${functionHex}"`);
    }

    return pollProps.dataLength;
  }

  private makeSenderId(functionHex: number | undefined, method: string, ...params: (string | number)[]) {
    const resolvedDataAddr: string = this.functionHexToStr(functionHex);

    const busNum = (typeof this.props.busNum === 'undefined') ? -1 : this.props.busNum;

    return [busNum, this.props.address, resolvedDataAddr, method, ...params].join();
  }


  // protected validateProps = (props: I2cToSlaveDriverProps): string | undefined => {
  //
  //   // TODO; validate poll props
  //
  //   return;
  // }

}


export default class Factory extends DriverFactoryBase<I2cToSlave, I2cToSlaveDriverProps> {
  protected SubDriverClass = I2cToSlave;
  protected instanceId = (props: I2cToSlaveDriverProps): string => {
    return `${(typeof props.busNum === 'undefined') ? -1 : props.busNum}-${props.address}`;
  }
}
