import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';

const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'eventemitter3';

//import {DEFAULT_INT} from '../../app/interfaces/MasterSlaveBusProps';
import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ImpulseInputDriver, ImpulseInputDriverProps} from '../Binary/ImpulseInput.driver';


type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cNodeDriverProps extends MasterSlaveBusProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // length of data which will be requested
  pollDataLength: number;
  pollDataAddress: string | number;

  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;

  // // or if you use several pins you can give them unique names.
  // ints?: {[index: string]: ImpulseInputDriverProps};
  // // setup how to get feedback of device's data address, by polling or interrupt.
  // // If you want to get feedback without data address, use "default" as a key.
  // feedback: {[index: string]: I2cFeedback};

}

// TODO: why ???? better to use undefined
const DEFAULT_DATA_ADDRESS = 'default';
const POLL_EVENT_NAME = 'poll';


export class I2cNodeDriver extends DriverBase<I2cNodeDriverProps> {
  private events: EventEmitter = new EventEmitter();
  private readonly poling: Poling = new Poling();
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;
  // data addr to use in poling.
  private pollDataAddressHex?: number;
  private pollDataAddressString: string = DEFAULT_DATA_ADDRESS;

  // last received data by data address
  private pollLastData?: Uint8Array;

  // TODO: зачем несколько ???
  //private intDrivers: {[index: string]: ImpulseInputDriver} = {};
  //
  // // TODO: review
  // private get intsProps(): ImpulseInputDriverProps {
  //
  //   // TODO: ??? нужно смержить с дефолтными значениями - impulseLength или оно само смержится в драйвере???
  //
  //   const result: {[index: string]: ImpulseInputDriverProps} = {
  //     ...this.props.ints,
  //   };
  //
  //   if (this.props.int) {
  //     result[DEFAULT_INT] = this.props.int;
  //   }
  //
  //   return result;
  // }

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  private get impulseInput(): ImpulseInputDriver {
    return this.depsInstances.impulseInput as ImpulseInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.driver')
      .getInstance({ bus: this.props.bus });

    this.depsInstances.impulseInput = await getDriverDep('ImpulseInput.driver')
      .getInstance(this.props.int || {});

    // for (let dataAddressStr of Object.keys(this.intsProps)) {
    //   this.intDrivers[dataAddressStr] = getDriverDep('ImpulseInput.driver')
    //     .getInstance(this.intsProps[dataAddressStr]);
    // }

    this.addressHex = hexStringToHexNum(String(this.props.address));
    this.pollDataAddressHex = this.parseDataAddress(this.props.pollDataAddress);
    this.pollDataAddressString = this.dataAddressToString(this.props.pollDataAddress);
  }

  protected didInit = async () => {
    this.setupFeedback();

    // for (let dataAddressStr of Object.keys(this.props.feedback)) {
    //   const feedBackProps: I2cFeedback = this.props.feedback[dataAddressStr];
    //   this.setupFeedback(dataAddressStr, feedBackProps);
    // }
  }

  destroy = () => {
    // TODO: удалить из pollLengths, Polling
    // TODO: удалить из intListenersLengths, unlisten of driver
  }


  getLastData(): Uint8Array | undefined {
    return this.pollLastData;
  }

  /**
   * Write only a dataAddress to bus
   */
  writeEmpty(dataAddress: number): Promise<void> {
    return this.i2cMaster.writeEmpty(this.addressHex, dataAddress);
  }

  async write(dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    await this.i2cMaster.write(this.addressHex, dataAddress, data);
  }

  async read(dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    return this.i2cMaster.read(this.addressHex, dataAddress, length);
  }

  // TODO: может всетаки read и request обновляют последний poling если совпадает dataAddress ???

  /**
   * Write and read from the same data address.
   */
  async request(dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    return this.i2cMaster.request(this.addressHex, dataAddress, dataToSend, readLength);
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in props: pollDataLength and pollDataAddress
   */
  async poll(): Promise<Uint8Array> {
    if (typeof this.props.pollDataAddress === 'undefined') {
      throw new Error(`You have to define a "pollDataAddress" prop to do poling`);
    }

    // TODO: рестартануть полинг чтобы он начался опять с этого момента
    // TODO: наверное это лучше сделать через класс Polling

    return this.doPoll();
  }

  /**
   * Listen to data which received by polling or interruption.
   */
  addListener(handler: Handler): void {
    this.events.addListener(POLL_EVENT_NAME, handler);
  }

  removeListener(handler: Handler): void {
    this.events.removeListener(POLL_EVENT_NAME, handler);
  }


  protected validateProps = (props: I2cNodeDriverProps): string | undefined => {

    // TODO; validate

    return;
  }


  private setupFeedback(): void {
    if (this.props.feedback === 'poll') {
      //const pollInterval: number = this.props.pollInterval || this.env.config.config.drivers.defaultPollInterval;

      //this.startPolling();
      this.poling.startPoling(this.doPoll, this.props.pollInterval, this.pollDataAddressString);
    }
    else if (this.props.feedback === 'int') {
      //const intProps: ImpulseInputDriverProps = this.intsProps[feedBackProps.intName || DEFAULT_INT];

      //this.startListenInt();
      this.impulseInput.addListener(this.doPoll);
    }

    // else don't use feedback
  }

  /**
   * Read data once and rise an data event
   */
  private doPoll = async (): Promise<Uint8Array> => {
    let data: Uint8Array;

    try {
      data = await this.i2cMaster.read(this.addressHex, this.pollDataAddressHex, this.props.pollDataLength);
    }
    catch (err) {
      this.events.emit(POLL_EVENT_NAME, err);

      // TODO: анверное лучше писать в лог или это делать в классе Poll
      // TODO: или просто ничего не делать ведь поднялось событие с err, но тогда что вернеть из ф-и ???

      throw err;
    }

    // if data is equal to previous data - do nothing
    if (typeof this.pollLastData !== 'undefined' && _isEqual(this.pollLastData, data)) return data;

    // save previous data
    this.pollLastData = data;
    // finally rise an event
    this.events.emit(POLL_EVENT_NAME, null, data);

    return data;
  }

  /**
   * Convert number to string or undefined to "DEFAULT_DATA_ADDRESS"
   */
  private dataAddressToString(dataAddress: string | number | undefined): string {
    if (typeof dataAddress === 'undefined') return DEFAULT_DATA_ADDRESS;
    if (typeof dataAddress === 'string') return dataAddress;

    return dataAddress.toString(16);
  }

  /**
   * Convert string or number data address to hex.
   * Undefined means no data address.
   */
  private parseDataAddress(dataAddressStr: string | number | undefined): number | undefined {
    if (typeof dataAddressStr === 'undefined') return undefined;
    if (dataAddressStr === DEFAULT_DATA_ADDRESS) return undefined;

    return parseInt(String(dataAddressStr), 16);
  }


  // private startPolling(): void {
  //   this.poling.startPoling(this.doPoll, this.props.pollInterval, this.pollDataAddressString);
  // }
  //
  // private startListenInt() {
  //   this.impulseInput.addListener(this.doPoll);
  // }

  // // TODO: разве это нужно здесь ???? лучше всегда принимать в качестве number
  // private normilizeAddr(address: string | number): number {
  //   return hexStringToHexNum(String(address));
  //
  //   // TODO; review
  //
  //   // return (Number.isInteger(addressHex as any))
  //   //   ? addressHex as number
  //   //   : hexStringToHexNum(addressHex as string);
  // }

}


export default class Factory extends DriverFactoryBase<I2cNodeDriver> {
  protected DriverClass = I2cNodeDriver;

  // TODO: review

  protected calcInstanceId = (instanceProps: {[index: string]: any}): string => {
    return `${instanceProps.bus}-${instanceProps.address}`;
  }
}
