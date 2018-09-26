import {DEFAULT_INT} from '../../app/interfaces/MasterSlaveBusProps';

const _isEqual = require('lodash/isEqual');

import {I2cFeedback} from './interfaces/I2cFeedback';
import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ImpulseInputDriver, ImpulseInputDriverProps} from '../Digital/ImpulseInput.driver';


const HANDLER_POSITION = 0;
const LENGTH_POSITION = 1;
const DEFAULT_DATA_ADDRESS = 'default';

type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cMasterDriverProps {
  bus: number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // or if you use several pins you can give them unique names.
  ints?: {[index: string]: ImpulseInputDriverProps};
  // setup how to get feedback of device's data address, by polling or interrupt.
  // If you want to get feedback without data address, use "default" as a key.
  feedback: {[index: string]: I2cFeedback};
}


export class I2cNodeDriver extends DriverBase<I2cMasterDriverProps> {
  private readonly poling: Poling = new Poling();
  private addressHex: number = -1;
  // listeners and lengths by data address (number as string) like {128: [handler, 2]}
  private listeners: {[index: string]: [Handler, number]} = {};
  // last received data by data address
  private pollLastData: {[index: string]: Uint8Array} = {};
  private intDrivers: {[index: string]: ImpulseInputDriver} = {};

  private get intsProps(): {[index: string]: ImpulseInputDriverProps} {
    const result: {[index: string]: ImpulseInputDriverProps} = {
      ...this.props.ints,
    };

    if (this.props.int) {
      result[DEFAULT_INT] = this.props.int;
    }

    return result;
  }

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  // private get impulseInputs(): {[index: string]: ImpulseInputDriver} {
  //   return this.depsInstances.impulseInput as ImpulseInputDriver;
  // }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = getDriverDep('I2cMaster.driver')
      .getInstance({ bus: this.props.bus });

    for (let dataAddressStr of Object.keys(this.intsProps)) {
      this.intDrivers[dataAddressStr] = getDriverDep('ImpulseInput.driver')
        .getInstance(this.intsProps[dataAddressStr]);
    }

    this.addressHex = this.normilizeAddr(this.props.address);
  }

  protected didInit = async () => {
    for (let dataAddressStr of Object.keys(this.props.feedback)) {
      const feedBackProps: I2cFeedback = this.props.feedback[dataAddressStr];
      this.setupFeedback(dataAddressStr, feedBackProps);
    }
  }

  destroy = () => {
    // TODO: удалить из pollLengths, Polling
    // TODO: удалить из intListenersLengths, unlisten of driver
  }


  getLastData(dataAddress: number | undefined): Uint8Array | undefined {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    return this.pollLastData[dataAddressStr];
  }

  /**
   * Write only a dataAddress to bus
   */
  writeEmpty(dataAddress: number): Promise<void> {
    return this.i2cMaster.writeEmpty(this.addressHex, dataAddress);
  }

  /**
   * Write and read from the same data address.
   */
  async request(dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {

    // TODO: наверное должен обновить lastPoll ????

    return this.i2cMaster.request(this.addressHex, dataAddress, dataToSend, readLength);
  }

  /**
   * Poll once immediately.
   * If there is previously registered listener, the length param have to be the same.
   */
  async poll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    if (this.listeners[dataAddressStr] && this.listeners[dataAddressStr][LENGTH_POSITION] !== length) {
      throw new Error(`You can't do poll using another length that previously registered poll handler`);
    }

    return this.doPoll(dataAddress, length);
  }

  async write(dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    await this.i2cMaster.write(this.addressHex, dataAddress, data);
  }

  /**
   * Listen to data which received by polling or interruption.
   * You have to specify length of data which will be received.
   * Only one listener of data address can be specified.
   */
  listenIncome(dataAddress: number | undefined, length: number, handler: Handler): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    // TODO: разрешить добавлять несколько лисненеров, но проверять длину

    if (this.listeners[dataAddressStr]) {
      throw new Error(`You can't specify another one listener
       to i2c bus "${this.props.bus}" address "${this.props.address}" data address "${dataAddressStr}".
       Another one was specified with length "${this.listeners[dataAddressStr][LENGTH_POSITION]}"`);
    }

    this.listeners[dataAddressStr] = [handler, length];
    //this.startListenFeedback(dataAddress, length);
  }

  removeListener(dataAddress: number | undefined, handler: Handler): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    delete this.listeners[dataAddressStr];
  }


  private setupFeedback(dataAddressStr: string, feedBackProps: I2cFeedback): void {
    const dataAddress: number | undefined = this.parseDataAddress(dataAddressStr);

    if (feedBackProps.feedback === 'poll') {
      const polingInterval: number = feedBackProps.polingInterval || this.env.config.config.drivers.defaultPollInterval;

      this.startPolling(dataAddress, feedBackProps.dataLength, polingInterval);
    }
    else if (feedBackProps.feedback === 'int') {
      //const intProps: ImpulseInputDriverProps = this.intsProps[feedBackProps.intName || DEFAULT_INT];

      this.startListenInt(dataAddress, feedBackProps.dataLength);
    }
  }

  /**
   * Read data once and rise an data event
   */
  private async doPoll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);
    const handler: Handler = this.listeners[dataAddressStr][HANDLER_POSITION];
    let data: Uint8Array;

    try {
      data = await this.i2cMaster.read(this.addressHex, dataAddress, length);
    }
    catch (err) {
      handler(err);

      throw err;
    }

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[dataAddressStr] !== 'undefined'
      && _isEqual(this.pollLastData[dataAddressStr], data)
    ) return data;

    // save previous data
    this.pollLastData[dataAddressStr] = data;
    // finally rise an event
    handler(null, data);

    return data;
  }


  protected validateProps = (props: I2cMasterDriverProps): string | undefined => {
    //if (Number.isInteger(props.bus)) return `Incorrect type bus number "${props.bus}"`;
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);

    // TODO: хотябы int или ints должны быть заданны

    return;
  }



  private startPolling(dataAddress: number | undefined, length: number, pollInterval: number): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    // do nothing if there is poling of this address
    if (this.poling.isInProgress(dataAddressStr)) {
      throw new Error(`Another poll of data address "${dataAddress}" was previously specified.`);
    }

    const cbWhichPoll = async (): Promise<void> => {
      await this.doPoll(dataAddress, length);
    };

    this.poling.startPoling(cbWhichPoll, pollInterval, dataAddressStr);
  }

  private startListenInt(dataAddress: number | undefined, length: number) {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    const handler = async () => {
      await this.doPoll(dataAddress, length);
    };

    this.intDrivers[dataAddressStr].addListener(handler);
  }

  // TODO: разве это нужно здесь ???? лучше всегда принимать в качестве number
  private normilizeAddr(addressHex: string | number): number {
    return (Number.isInteger(addressHex as any))
      ? addressHex as number
      : hexStringToHexNum(addressHex as string);
  }

  /**
   * Convert number to string or undefined to "DEFAULT_DATA_ADDRESS"
   */
  private dataAddressToString(dataAddress: number | undefined): string {
    if (typeof dataAddress === 'undefined') return DEFAULT_DATA_ADDRESS;

    return dataAddress.toString(16);
  }

  private parseDataAddress(dataAddressStr: string): number | undefined {
    if (dataAddressStr === DEFAULT_DATA_ADDRESS) return undefined;

    return parseInt(dataAddressStr, 16);
  }
}


export default class Factory extends DriverFactoryBase<I2cNodeDriver, I2cMasterDriverProps> {
  protected combinedInstanceIdName = (instanceProps?: {[index: string]: any}): string => {

    // TODO: использовать правила валидации
    // TODO: может использовать какую-то автоматическую валидацию props

    if (!instanceProps) {
      throw new Error(`You have to specify props for instance of driver DigitalPcf8574`);
    }
    else if (!Number.isInteger(instanceProps.bus)) {
      throw new Error(`The bus param has to be a number of driver DigitalPcf8574`);
    }
    else if (!Number.isInteger(instanceProps.address)) {
      throw new Error(`The address param has to be a number of driver DigitalPcf8574`);
    }

    return `${instanceProps.bus}-${instanceProps.address}`;
  }
  protected DriverClass = I2cNodeDriver;
}
