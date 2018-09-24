import {I2cMasterDriver} from './I2cMaster.driver';

const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'events';

import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum, addFirstItemUint8Arr } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';


//const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;
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

  protected didInit = async () => {
    // TODO: поидее их нужно указывать на dataAddress
    // if (this.props.feedback === 'poll') {
    //   this.startPolling();
    // }
    // else if (this.props.feedback === 'int') {
    //   this.startListenInt();
    // }
  }



  getLastData(dataAddress: number | undefined): Uint8Array {
    // TODO: что делать с дефолтным ????
    return this.pollLastData[dataAddress];
  }

  // /**
  //  * Read once from bus.
  //  * If dataAddress is specified, it do request to data address(dataAddress) first.
  //  */
  // async read(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
  //   return this.i2cMaster.read(this.addressHex, dataAddress, length);
  // }

  async poll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    // TODO: разово опросить с подъемом события и вернуть значение
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

    // TODO: если уже есть полинг/int - то проверять чтобы длина была та же иначе throw
    // TODO: что если dataAddress = undefined - тогда повешать дефолтный листенер наверное

    this.listeners[dataAddress] = [handler, length];

    // const eventName = this.generateId(this.addressHex, dataAddress);
    //
    // // start poling/int if need
    // this.startListen(addressHex, dataAddress, length);
    // // listen to events of this address and dataAddress
    // this.events.addListener(eventName, handler);
  }

  removeListener(dataAddress: number | undefined, handler: Handler): void {

    // TODO: найти и удалить из this.listeners
    // TODO: test

    // const addressHex: number = this.normilizeAddr(i2cAddress);
    // const id = this.generateId(addressHex, dataAddress);
    //
    // // TODO: останавливает полинг если уже нет ни одного слушателя
    //
    // this.events.removeListener(id, handler);
  }


  private async pollDataAddresses() {
    for (let dataAddressStr of Object.keys(this.listeners)) {
      // TODO: что делать с дефолтным ????
      const dataAddress: number = Number(dataAddressStr);

      await this.doPoll(dataAddress, this.listeners[dataAddressStr][LENGTH_POSITION]);
    }
  }

  /**
   * Read data once and rise data event
   */
  private async doPoll(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    //const id = this.generateId(addressHex, dataAddress);

    // TODO: проверить длинну - если есть полинг или листенеры - то должна соответствовать ????

    const data: Uint8Array = await this.i2cMaster.read(this.addressHex, dataAddress, length);

    // try {
    //   data = await this.i2cMaster.read(this.addressHex, dataAddress, length);
    // }
    // catch (err) {
    //
    //   // this.events.emit(id, err);
    //   //
    //   // return;
    // }

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[id] !== 'undefined'
      && _isEqual(this.pollLastData[id], data)
    ) return data;

    // save previous data
    this.pollLastData[dataAddress] = data;
    // finally rise an event

    // TODO: just call handler of this.listeners[dataAddress]
    //this.events.emit(id, null, data);

    return data;
  }















  private startPolling(i2cAddress: string | number, dataAddress: number | undefined, length: number): void {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // TODO: test

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
