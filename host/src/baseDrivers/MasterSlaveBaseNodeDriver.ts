import DriverBase from '../app/entities/DriverBase';
import IndexedEvents from '../helpers/IndexedEvents';
import Poling from '../helpers/Poling';
import Sender from '../helpers/Sender';
import {ImpulseInputDriverProps} from '../drivers/Binary/ImpulseInput.driver';
import MasterSlaveBusProps from '../app/interfaces/MasterSlaveBusProps';
import {find, isEqual} from '../helpers/lodashLike';
import {hexStringToHexNum} from '../helpers/binaryHelpers';


export type Handler = (dataAddressStr: number | string, data: Uint8Array) => void;
export type ErrorHandler = (dataAddressStr: number | string, err: Error) => void;

interface PollProps {
  // data address e.g "5a" or "33" or 27
  dataAddress: string | number;
  length: string;
  interval?: number;
}

export interface MasterSlaveBaseProps extends MasterSlaveBusProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // length of data which will be requested
  // pollDataLength: number;
  // pollDataAddress?: string | number;

  poll: PollProps[];
}

//const DEFAULT_POLL_ID = 'default';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Write data to slave.
   * * write(dataAddress, data) - write data ti data address
   * * write(dataAddress) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void>;
  abstract read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array>;
  abstract request(dataAddressStr?: string | number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;
  protected abstract doPoll(dataAddressStr: string | number): Promise<Uint8Array>;
  protected abstract setupFeedback(): void;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly pollErrorEvents = new IndexedEvents<ErrorHandler>();
  protected readonly poling: Poling = new Poling();

  // last received data by poling by dataAddress
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};
  protected readonly sender: Sender = this.newSender();


  // protected doInit = async (getDriverDep: GetDriverDep) => {
  // }

  protected appDidInit = async () => {
    // start poling or int listeners after app is initialized
    this.setupFeedback();
  }


  destroy = () => {
  }

  getLastData(dataAddressStr: string | number): Uint8Array | undefined {
    return this.pollLastData[dataAddressStr];
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in poll prop.
   * It rejects promise on error
   */
  async poll(): Promise<void> {
    if (this.props.feedback === 'none') {
      throw new Error(`MasterSlaveBaseNodeDriver.poll: Feedback hasn't been configured`);
    }

    for (let item of this.props.poll) {
      await this.poling.restart(String(item.dataAddress));
    }
  }

  /**
   * Listen to data which received by polling or interruption.
   */
  addListener(handler: Handler): number {
    return this.pollEvents.addListener(handler);
  }

  removeListener(handlerIndex: number): void {
    this.pollEvents.removeListener(handlerIndex);
  }

  /**
   * Listen to errors which take place while poling or interruption is in progress
   */
  addPollErrorListener(handler: ErrorHandler): number {
    return this.pollErrorEvents.addListener(handler);
  }

  removePollErrorListener(handlerIndex: number): void {
    this.pollErrorEvents.removeListener(handlerIndex);
  }

  protected startPolls() {
    if (this.props.feedback !== 'poll') {
      this.env.system.log.warn(`MasterSlaveBaseNodeDriver.startPolls: Trying to start`);

      return;
    }

    for (let item of this.props.poll) {
      this.startPolingOnDataAddress(item.dataAddress);
    }
  }

  protected stopPollings() {
    if (this.props.feedback !== 'poll') return;

    for (let item of this.props.poll) {
      this.poling.stop(String(item.dataAddress));
    }
  }

  protected updateLastPollData(dataAddressStr: number | string, data: Uint8Array) {
    // if data is equal to previous data - do nothing
    if (isEqual(this.pollLastData[dataAddressStr], data)) return;

    // save data
    this.pollLastData[dataAddressStr] = data;
    // finally rise an event
    this.pollEvents.emit(dataAddressStr, data);
  }

  protected makeDataAddressHexNum(dataAddrStr: string | number): number {
    return hexStringToHexNum(dataAddrStr);
  }


  private startPolingOnDataAddress(dataAddressStr: number | string) {
    if (this.props.feedback !== 'poll') return;

    const pollProps: PollProps | undefined = this.getPollProps(dataAddressStr);

    if (!pollProps) {
      throw new Error(`MasterSlaveBaseNodeDriver.startPoling: Can't find poll props of data address "${dataAddressStr}"`);
    }

    const pollInterval: number = (typeof pollProps.interval === 'undefined')
      ? this.props.pollInterval
      : pollProps.interval;

    this.poling.start(
      () => this.doPoll(dataAddressStr),
      pollInterval,
      String(dataAddressStr)
    );
  }

  private getPollProps(dataAddrStr: string | number): PollProps | undefined {
    return find(this.props.poll, (item: PollProps) => {
      return item.dataAddress === dataAddrStr;
    });
  }

  /**
   * Convert string or number data address to hex.
   * Undefined means no data address.
   */
  // private parseDataAddress(dataAddressStr: string | number | undefined): number | undefined {
  //   if (typeof dataAddressStr === 'undefined') return undefined;
  //
  //   return parseInt(String(dataAddressStr), 16);
  // }

  // private pollAllTheDataAddresses() {
  //
  // }

  // /**
  //  * Convert number to string or undefined to "DEFAULT_POLL_ID"
  //  */
  // protected dataAddressToString(dataAddress: string | number | undefined): string {
  //   if (typeof dataAddress === 'undefined') return DEFAULT_POLL_ID;
  //   if (typeof dataAddress === 'string') return dataAddress;
  //
  //   return dataAddress.toString(16);
  // }

}
