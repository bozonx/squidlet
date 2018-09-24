const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum, addFirstItemUint8Arr } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';


const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;

type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cMasterDriverProps {
  bus: number;
}


export class I2cMasterDriver extends DriverBase<I2cMasterDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  // TODO: review poling
  private readonly poling: Poling = new Poling();
  private pollLastData: {[index: string]: Uint8Array} = {};

  private get i2cMasterDev(): I2cMaster {
    return this.depsInstances.i2cMaster as I2cMaster;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = getDriverDep('I2cMaster.dev')
      .getInstance(this.props);
  }


  // TODO: add получение списка устройств


  /**
   * Read once from bus.
   * If dataAddress is specified, it do request to data address(dataAddress) first.
   */
  async read(i2cAddress: string | number, dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const addressHex: number = this.normilizeAddr(i2cAddress);

    // TODO: ??? разве это нужно ???
    // write command
    if (typeof dataAddress !== 'undefined') {
      await this.writeEmpty(addressHex, dataAddress);
    }
    // read from bus
    return this.i2cMasterDev.readFrom(this.props.bus, addressHex, length);
  }

  async write(i2cAddress: string | number, dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    await this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  }

  /**
   * Write only a dataAddress to bus
   */
  writeEmpty(i2cAddress: string | number, dataAddress: number): Promise<void> {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const dataToWrite = new Uint8Array(REGISTER_LENGTH);

    dataToWrite[0] = dataAddress;

    return this.i2cMasterDev.writeTo(this.props.bus, addressHex, dataToWrite);
  }

  /**
   * Write and read from the same data address.
   */
  async request(i2cAddress: string | number, dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    const addressHex: number = this.normilizeAddr(i2cAddress);

    await this.write(addressHex, dataAddress, dataToSend);

    return this.read(addressHex, dataAddress, readLength);
  }





  // TODO: разве это нужно здесь ???? лучше всегда принимать в качестве number
  private normilizeAddr(addressHex: string | number): number {
    return (Number.isInteger(addressHex as any))
      ? addressHex as number
      : hexStringToHexNum(addressHex as string);
  }

  protected validateProps = (props: I2cMasterDriverProps): string | undefined => {
    if (Number.isInteger(props.bus)) return `Incorrect type bus number "${props.bus}"`;
    //if (Number.isNaN(props.bus)) throw new Error(`Incorrect bus number "${props.bus}"`);

    return;
  }

}


export default class I2cMasterFactory extends DriverFactoryBase<I2cMasterDriver, I2cMasterDriverProps> {
  protected instanceIdName: string = 'bus';
  protected DriverClass = I2cMasterDriver;
}
