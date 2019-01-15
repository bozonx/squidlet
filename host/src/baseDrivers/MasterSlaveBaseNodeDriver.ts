import DriverBase from '../app/entities/DriverBase';
import IndexedEvents from '../helpers/IndexedEvents';
import Polling from '../helpers/Polling';
import Sender from '../helpers/Sender';
import {ImpulseInputDriverProps} from '../drivers/Binary/ImpulseInput.driver';
import {find, isEqual} from '../helpers/lodashLike';
import {hexStringToHexNum} from '../helpers/binaryHelpers';


// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (dataAddressStr: number | string | undefined, data: Uint8Array) => void;
export type ErrorHandler = (dataAddressStr: number | string | undefined, err: Error) => void;

export interface PollProps {
  // data address e.g "5a" or "33" or 27. Undefined means do poll without specifying a data address
  dataAddress?: string | number;
  dataLength?: number;
  interval?: number;
}

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  poll: PollProps[];
  feedback?: FeedbackType;
  // Default poll interval. By default is 1000
  pollInterval: number;
}

export const UNDEFINED_DATA_ADDRESS = 'default';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Write data to slave.
   * * write(dataAddress, data) - write data to data address
   * * write(dataAddress) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void>;
  abstract read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array>;
  abstract request(dataAddressStr?: string | number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;
  protected abstract doPoll(dataAddressStr: string | number | undefined): Promise<Uint8Array>;
  protected abstract setupFeedback(): void;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly pollErrorEvents = new IndexedEvents<ErrorHandler>();
  protected readonly polling: Polling = new Polling();

  // last received data by polling by dataAddress
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};
  protected readonly sender: Sender = this.newSender();


  protected doInit = async () => {
    // listen to errors which happen on polling
    for (let pollProps of this.props.poll) {
      const resolvedDataAddr: string = this.resolveDataAddressStr(pollProps.dataAddress);

      this.polling.addListener((err: Error) => {
        const msg = `MasterSlaveBaseNodeDriver: Error on polling to dataAddress "${resolvedDataAddr}". Props are "${JSON.stringify(this.props)}": ${String(err)}`;

        this.pollErrorEvents.emit(resolvedDataAddr, new Error(msg));
      }, resolvedDataAddr);
    }
  }

  protected appDidInit = async () => {
    // start polling or int listeners after app is initialized
    this.setupFeedback();
  }

  destroy = () => {
  }


  getLastData(dataAddressStr: string | number | undefined): Uint8Array | undefined {
    const resolvedDataAddr: string = this.resolveDataAddressStr(dataAddressStr);

    return this.pollLastData[resolvedDataAddr];
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in poll prop.
   * It rejects promise on error
   */
  async pollOnce(): Promise<void> {
    if (!this.props.feedback) {
      throw new Error(`MasterSlaveBaseNodeDriver.poll: Feedback hasn't been configured`);
    }

    for (let item of this.props.poll) {
      const resolvedDataAddr: string = this.resolveDataAddressStr(item.dataAddress);

      await this.polling.restart(resolvedDataAddr);
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
   * Listen to errors which take place while polling or interruption is in progress
   */
  addPollErrorListener(handler: ErrorHandler): number {
    return this.pollErrorEvents.addListener(handler);
  }

  removePollErrorListener(handlerIndex: number): void {
    this.pollErrorEvents.removeListener(handlerIndex);
  }

  /**
   * Poll all the defined polling to data addresses
   */
  protected pollAllDataAddresses = async () => {
    for (let item of this.props.poll) {
      try {
        await this.doPoll(item.dataAddress);
      }
      catch (err) {
        const resolvedDataAddr: string = this.resolveDataAddressStr(item.dataAddress);

        this.pollErrorEvents.emit(resolvedDataAddr, err);
      }
    }
  }

  protected startPolls() {
    if (this.props.feedback !== 'poll') return;

    for (let item of this.props.poll) {
      this.startPollingOnDataAddress(item.dataAddress);
    }
  }

  protected stopPollings() {
    if (this.props.feedback !== 'poll') return;

    for (let item of this.props.poll) {
      const resolvedDataAddr: string = this.resolveDataAddressStr(item.dataAddress);

      this.polling.stop(resolvedDataAddr);
    }
  }

  protected updateLastPollData(dataAddressStr: number | string | undefined, data: Uint8Array) {
    const pollProps = this.getPollProps(dataAddressStr);
    const resolvedDataAddr: string = this.resolveDataAddressStr(dataAddressStr);

    // do nothing if it isn't polling data address
    if (typeof dataAddressStr === 'undefined' || !pollProps) return;

    // if data is equal to previous data - do nothing
    if (isEqual(this.pollLastData[resolvedDataAddr], data)) return;

    // save data
    this.pollLastData[resolvedDataAddr] = data;
    // finally rise an event
    this.pollEvents.emit(resolvedDataAddr, data);
  }

  protected makeDataAddrHex(dataAddressStr: string | number | undefined): number | undefined {
    if (typeof dataAddressStr === 'undefined') return;

    return hexStringToHexNum(dataAddressStr);
  }

  /**
   * Find poll props line {dataAddress, length, interval}
   * If dataAddressStr is undefined then item with dataAddress = undefined will be found.
   */
  protected getPollProps(dataAddressStr: string | number | undefined): PollProps | undefined {
    return find(this.props.poll, (item: PollProps) => {
      return item.dataAddress === dataAddressStr;
    });
  }

  protected resolveDataAddressStr(dataAddressStr: number | string | undefined): string {
    if (typeof dataAddressStr === 'undefined') return UNDEFINED_DATA_ADDRESS;

    return String(dataAddressStr);
  }


  private startPollingOnDataAddress(dataAddressStr: number | string | undefined) {
    const pollProps: PollProps | undefined = this.getPollProps(dataAddressStr);

    if (!pollProps) {
      throw new Error(`MasterSlaveBaseNodeDriver.startPolling: Can't find poll props of data address "${dataAddressStr}"`);
    }

    const pollInterval: number = (typeof pollProps.interval === 'undefined')
      ? this.props.pollInterval
      : pollProps.interval;
    const resolvedDataAddr: string = this.resolveDataAddressStr(dataAddressStr);

    // TODO: может выполнять pollAllDataAddresses? тогда не получится указать pollInterval на каждый полинг

    this.polling.start(
      () => this.doPoll(dataAddressStr),
      pollInterval,
      resolvedDataAddr
    );
  }

}
