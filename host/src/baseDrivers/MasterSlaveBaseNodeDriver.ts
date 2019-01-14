import DriverBase from '../app/entities/DriverBase';
import IndexedEvents from '../helpers/IndexedEvents';
import Polling from '../helpers/Polling';
import Sender from '../helpers/Sender';
import {ImpulseInputDriverProps} from '../drivers/Binary/ImpulseInput.driver';
import {find, isEqual} from '../helpers/lodashLike';
import {hexStringToHexNum} from '../helpers/binaryHelpers';


// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (dataAddressStr: number | string, data: Uint8Array) => void;
export type ErrorHandler = (dataAddressStr: number | string, err: Error) => void;

interface PollProps {
  // data address e.g "5a" or "33" or 27
  dataAddress: string | number;
  length?: number;
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
  protected abstract doPoll(dataAddressStr: string | number): Promise<Uint8Array>;
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
      this.polling.addListener((err: Error) => {
        const msg = `MasterSlaveBaseNodeDriver: Error on polling to dataAddress "${pollProps.dataAddress}". Props are "${JSON.stringify(this.props)}": ${String(err)}`;

        this.pollErrorEvents.emit(pollProps.dataAddress, new Error(msg));
      }, String(pollProps.dataAddress));
    }
  }

  protected appDidInit = async () => {
    // start polling or int listeners after app is initialized
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
  async pollOnce(): Promise<void> {
    if (!this.props.feedback) {
      throw new Error(`MasterSlaveBaseNodeDriver.poll: Feedback hasn't been configured`);
    }

    for (let item of this.props.poll) {
      await this.polling.restart(String(item.dataAddress));
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

  protected pollAllDataAddresses = async () => {
    for (let item of this.props.poll) {
      try {
        await this.doPoll(this.makeDataAddressHexNum(item.dataAddress));
      }
      catch (err) {
        this.pollErrorEvents.emit(item.dataAddress, err);
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
      this.polling.stop(String(item.dataAddress));
    }
  }

  protected updateLastPollData(dataAddressStr: number | string | undefined, data: Uint8Array) {
    // is data address which read uses in polling
    const isItPollingDataAddr: boolean = typeof dataAddressStr !== 'undefined'
      && this.props.feedback
      && this.props.poll.map((item) => item.dataAddress).includes(dataAddressStr)
      || false;

    // do nothing if it isn't polling data address
    if (typeof dataAddressStr === 'undefined' || !isItPollingDataAddr) return;

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

  protected getPollProps(dataAddrStr: string | number): PollProps | undefined {
    return find(this.props.poll, (item: PollProps) => {
      return item.dataAddress === dataAddrStr;
    });
  }


  private startPollingOnDataAddress(dataAddressStr: number | string) {
    const pollProps: PollProps | undefined = this.getPollProps(dataAddressStr);

    if (!pollProps) {
      throw new Error(`MasterSlaveBaseNodeDriver.startPolling: Can't find poll props of data address "${dataAddressStr}"`);
    }

    const pollInterval: number = (typeof pollProps.interval === 'undefined')
      ? this.props.pollInterval
      : pollProps.interval;

    // TODO: может выполнять pollAllDataAddresses? тогда не получится указать pollInterval на каждый полинг

    this.polling.start(
      () => this.doPoll(dataAddressStr),
      pollInterval,
      String(dataAddressStr)
    );
  }

}
