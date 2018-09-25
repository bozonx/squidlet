import {I2cMasterDriver} from './I2cMaster.driver';

const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'events';

import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';


const HANDLER_POSITION = 0;
const LENGTH_POSITION = 1;

type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cMasterDriverProps extends MasterSlaveBusProps {
  bus: number;
  address: number;
}


export class I2cNodeDriver extends DriverBase<I2cMasterDriverProps> {
  private addressHex: number = -1;
  private readonly events: EventEmitter = new EventEmitter();
  // TODO: review poling
  private readonly poling: Poling = new Poling();
  private pollLastData: {[index: string]: Uint8Array} = {};
  // listeners and lengths by data address (number as string) like {128: [handler, 2]}
  private listeners: {[index: string]: [Handler, number]} = {};

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = getDriverDep('I2cMaster.driver')
      .getInstance({ bus: this.props.bus });

    //const addressHex: number = this.normilizeAddr(i2cAddress);
  }


  getLastData(dataAddress: number | undefined): Uint8Array {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    return this.pollLastData[dataAddressStr];
  }

  /**
   * Poll once immediately.
   * If there is previously registered listener, the length param have to be the same.
   */
  async poll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
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
   */
  listenIncome(dataAddress: number | undefined, length: number, handler: Handler): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    // TODO: можно ли вешать более 1го хэндлера??? иначе они будут перебивать друг друга

    this.listeners[dataAddressStr] = [handler, length];
  }

  removeListener(dataAddress: number | undefined, handler: Handler): void {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);

    delete this.listeners[dataAddressStr];
  }


  private async pollDataAddresses() {
    for (let dataAddressStr of Object.keys(this.listeners)) {
      const dataAddress: number | undefined = this.parseDataAddress(dataAddressStr);

      await this.doPoll(dataAddress, this.listeners[dataAddressStr][LENGTH_POSITION]);
    }
  }

  /**
   * Read data once and rise data event
   */
  private async doPoll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const dataAddressStr: string = this.dataAddressToString(dataAddress);
    if (this.listeners[dataAddressStr] && this.listeners[dataAddressStr][LENGTH_POSITION] !== length) {
      throw new Error(`You can't do poll using another length that previously registered poll handler`);
    }

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


  /**
   * Convert number to string of undefined to "undefined"
   */
  private dataAddressToString(dataAddress: number | undefined): string {
    return String(dataAddress);
  }

  private parseDataAddress(dataAddressStr: string): number | undefined {
    if (dataAddressStr === 'undefined') return undefined;

    return Number(dataAddressStr);
  }











  private startPolling(i2cAddress: string | number, dataAddress: number | undefined, length: number): void {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // TODO: test
    // TODO: если нет листенеров - то не опрашивать

    if (this.poling.isInProgress(id)) {
      // TODO: если запущен то проверить длинну и ничего не делать
      // TODO: если длина не совпадает то не фатальная ошибка

      return;
    }

    const cbWhichPoll = (): Promise<void> => {
      return this.poll(addressHex, dataAddress, length);
    };

    // TODO: где взять poll interval ???
    this.poling.startPoling(cbWhichPoll, 1000, id);
  }

  private startListenInt(i2cAddress: string | number, dataAddress: number | undefined, length: number, gpioInput: number) {

    // TODO: test
    // TODO: если нет листенеров - то не опрашивать

    const addressHex: number = this.normilizeAddr(i2cAddress);
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  // TODO: разве это нужно здесь ???? лучше всегда принимать в качестве number
  private normilizeAddr(addressHex: string | number): number {
    return (Number.isInteger(addressHex as any))
      ? addressHex as number
      : hexStringToHexNum(addressHex as string);
  }

  private generateId(addressHex: number, dataAddress: number | undefined): string {
    if (typeof dataAddress === 'undefined') return addressHex.toString();

    return [ addressHex.toString(), dataAddress ].join('-');
  }

  private startListen(addressHex: number, dataAddress: number | undefined, length: number): void {
    // TODO: в соответсвии с конфигом запустить poling или int
    // TODO: если уже запущенно - ничего не делаем
    // TODO: если уже запущенно - и длинна не совпадает - ругаться в консоль
  }

  protected validateProps = (props: I2cMasterDriverProps): string | undefined => {
    if (Number.isInteger(props.bus)) return `Incorrect type bus number "${props.bus}"`;
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);

    return;
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
