const _isEqual = require('lodash/isEqual');

import {I2cMasterDriver} from './I2cMaster.driver';
import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ImpulseInputDriver} from '../Digital/ImpulseInput.driver';


const HANDLER_POSITION = 0;
const LENGTH_POSITION = 1;
const DEFAULT_DATA_ADDRESS = 'default';

type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cMasterDriverProps extends MasterSlaveBusProps {
  bus: number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
}


export class I2cNodeDriver extends DriverBase<I2cMasterDriverProps> {
  private readonly poling: Poling = new Poling();
  private addressHex: number = -1;
  // listeners and lengths by data address (number as string) like {128: [handler, 2]}
  private listeners: {[index: string]: [Handler, number]} = {};
  // last received data by data address
  private pollLastData: {[index: string]: Uint8Array} = {};
  private pollLengths: {[index: string]: number} = {};
  private intListenersLengths: {[index: string]: number} = {};

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  private get impulseInput(): ImpulseInputDriver {
    return this.depsInstances.impulseInput as ImpulseInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = getDriverDep('I2cMaster.driver')
      .getInstance({ bus: this.props.bus });

    // TODO: initialize ImpulseInputDriver

    this.addressHex = this.normilizeAddr(this.props.address);
  }


  getLastData(dataAddress: number | undefined): Uint8Array | undefined {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    return this.pollLastData[dataAddressStr];
  }

  // TODO: use feedback params
  setupFeedback(dataAddress: number | undefined, length: number): void {

    // TODO: длина слушателя этого адреса должна совпадать с длиной полинга

    if (this.props.feedback === 'poll') {
      this.startPolling(dataAddress, length);
    }
    else if (this.props.feedback === 'int') {
      this.startListenInt(dataAddress, length);
    }
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
   * Listen to data which received by polling or interruption.
   * You have to specify length of data which will be received.
   * Only one listener of data address can be specified.
   */
  listenIncome(dataAddress: number | undefined, length: number, handler: Handler): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

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

    // TODO: remove poling or int listener

    delete this.listeners[dataAddressStr];
  }


  // private async pollDataAddresses() {
  //   for (let dataAddressStr of Object.keys(this.listeners)) {
  //     const dataAddress: number | undefined = this.parseDataAddress(dataAddressStr);
  //
  //     await this.doPoll(dataAddress, this.listeners[dataAddressStr][LENGTH_POSITION]);
  //   }
  // }

  /**
   * Read data once and rise an data event
   */
  private async doPoll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    // TODO: если произошла ошибка то наверное лучше вызвать handler(error) ???

    const data: Uint8Array = await this.i2cMaster.read(this.addressHex, dataAddress, length);

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[dataAddressStr] !== 'undefined'
      && _isEqual(this.pollLastData[dataAddressStr], data)
    ) return data;

    // save previous data
    this.pollLastData[dataAddressStr] = data;
    // finally rise an event
    const handler: Handler = this.listeners[dataAddressStr][HANDLER_POSITION];

    handler(null, data);

    return data;
  }


  protected validateProps = (props: I2cMasterDriverProps): string | undefined => {
    //if (Number.isInteger(props.bus)) return `Incorrect type bus number "${props.bus}"`;
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);

    return;
  }



  private startPolling(dataAddress: number | undefined, length: number): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    // do nothing if there is poling of this address
    if (this.poling.isInProgress(dataAddressStr)) {
      // TODO: может лучше отменить старый полинг и начать новый ???
      return;
    }

    this.pollLengths[dataAddressStr] = length;

    const cbWhichPoll = async (): Promise<void> => {
      await this.doPoll(dataAddress, length);
    };

    // TODO: сохранить длинну чтобы потом сравнивать

    this.poling.startPoling(cbWhichPoll, this.props.polingInterval as number, dataAddressStr);
  }

  private startListenInt(dataAddress: number | undefined, length: number) {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);
    // TODO: может сделать общий хэндлер и запускать doPoll на все зарегистрированные хэндлеры???
    // TODO: что если int будет на каждый data address ?????
    const handler = async () => {
      await this.doPoll(dataAddress, length);
    };

    this.intListenersLengths[dataAddressStr] = length;

    // TODO: нужно гдето-взять параметры пина - pullup, invert, debounce и тд
    // TODO: если запущен то ничего не делать - или удалить старый листенер
    // TODO: использовать простой импульс - пришла 1 - сразу blockTime - ничего не принимаем
    // TODO: сравнивать длинну ???

    this.impulseInput.addListener(handler);
  }

  private stopPoling() {
    // TODO: удалить из pollLengths, Polling
  }

  private removeIntListener() {
    // TODO: удалить из intListenersLengths, unlisten of driver
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

    return String(dataAddress);
  }

  private parseDataAddress(dataAddressStr: string): number | undefined {
    if (dataAddressStr === DEFAULT_DATA_ADDRESS) return undefined;

    return Number(dataAddressStr);
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
