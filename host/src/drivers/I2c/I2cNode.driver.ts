const _omit = require('lodash/omit');
const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'eventemitter3';

import MasterSlaveBusProps from '../../app/interfaces/MasterSlaveBusProps';
import {I2cMasterDriver} from './I2cMaster.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import I2cMaster from '../../app/interfaces/dev/I2cMaster';
import { hexStringToHexNum } from '../../helpers/helpers';
import Poling from '../../helpers/Poling';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ImpulseInputDriver, ImpulseInputDriverProps} from '../Binary/ImpulseInput.driver';


export type Handler = (error: Error | null, data?: Uint8Array) => void;

interface I2cNodeDriverProps extends MasterSlaveBusProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // length of data which will be requested
  pollDataLength: number;

  // TODO: поидее может быть undefined

  pollDataAddress: string | number;

  bus?: string | number;
  // it can be i2c address as a string like '5a' or number equivalent - 90
  address: string | number;
}

// TODO: why ???? better to use undefined
const DEFAULT_DATA_ADDRESS = 'default';
const POLL_EVENT_NAME = 'poll';


export class I2cNodeDriver extends DriverBase<I2cNodeDriverProps> {
  private events: EventEmitter = new EventEmitter();
  private readonly poling: Poling = new Poling();
  // converted address string or number to hex. E.g '5a' => 90, 22 => 34
  private addressHex: number = -1;
  // data addr in hex to use in poling.
  private pollDataAddressHex?: number;
  private pollDataAddressString: string = DEFAULT_DATA_ADDRESS;

  // last received data by poling
  // it needs to decide to rise change event or not
  private pollLastData?: Uint8Array;

  private get i2cMaster(): I2cMasterDriver {
    return this.depsInstances.i2cMaster as I2cMasterDriver;
  }

  private get impulseInput(): ImpulseInputDriver {
    return this.depsInstances.impulseInput as ImpulseInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cMaster = await getDriverDep('I2cMaster.driver')
      .getInstance(_omit(this.props,
        'int', 'pollDataLength', 'pollDataAddress', 'address', 'feedback', 'pollInterval'
      ));

    this.depsInstances.impulseInput = await getDriverDep('ImpulseInput.driver')
      .getInstance(this.props.int || {});

    this.addressHex = hexStringToHexNum(String(this.props.address));
    this.pollDataAddressHex = this.parseDataAddress(this.props.pollDataAddress);
    this.pollDataAddressString = this.dataAddressToString(this.props.pollDataAddress);
  }

  protected didInit = async () => {
    this.setupFeedback();
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
    const result: Uint8Array = await this.i2cMaster.read(this.addressHex, dataAddress, length);

    // update last poll data if data address the same
    if (this.props.feedback && dataAddress === this.props.pollDataAddress) {
      this.updateLastPollData(result);
    }

    return result;
  }

  /**
   * Write and read from the same data address.
   */
  async request(dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    const result: Uint8Array = await this.i2cMaster.request(this.addressHex, dataAddress, dataToSend, readLength);

    // update last poll data if data address the same
    if (this.props.feedback && dataAddress === this.props.pollDataAddress) {
      this.updateLastPollData(result);
    }

    return result;
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in props: pollDataLength and pollDataAddress.
   * It reject promise on error
   */
  async poll(): Promise<Uint8Array> {
    if (typeof this.props.pollDataAddress === 'undefined') {
      throw new Error(`You have to define a "pollDataAddress" prop to do poll`);
    }

    this.stopPoling();

    const result: Uint8Array = await this.doPoll();

    this.startPoling();

    return result;
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
    if (this.props.feedback === 'int') {
      return this.impulseInput.addListener(this.doPoll);
    }
    // start poling if feedback is poll
    this.startPoling();
    // else don't use feedback at all
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

      throw err;
    }

    this.updateLastPollData(data);

    return data;
  }

  private updateLastPollData(data: Uint8Array) {
    // if data is equal to previous data - do nothing
    if (typeof this.pollLastData !== 'undefined' && _isEqual(this.pollLastData, data)) return;

    // save data
    this.pollLastData = data;
    // finally rise an event
    this.events.emit(POLL_EVENT_NAME, null, data);
  }

  private stopPoling() {
    if (this.props.feedback !== 'poll') return;

    this.poling.stop(this.pollDataAddressString);
  }

  private startPoling() {
    if (this.props.feedback !== 'poll') return;

    const wrapper = async (): Promise<Uint8Array | undefined> => {
      try {
        return await this.doPoll();
      }
      catch (err) {
        this.env.log.error(
          `I2cNode.driver Poll error of bus "${this.props.bus}",
           address "${this.props.address}", dataAddress "${this.props.pollDataAddress}": ${String(err)}`
        );
      }

      return;
    };


    this.poling.start(wrapper, this.props.pollInterval, this.pollDataAddressString);
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

}


export default class Factory extends DriverFactoryBase<I2cNodeDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = I2cNodeDriver;
}
