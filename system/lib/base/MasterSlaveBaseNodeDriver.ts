import DriverBase from '../../base/DriverBase';
import IndexedEvents from '../IndexedEvents';
import Polling from '../Polling';
import Sender from '../Sender';
//import {ImpulseInputProps} from '../drivers/Binary/ImpulseInput.driver';
import {findObj} from '../objects';
import {hexStringToHexNum} from '../binaryHelpers';
import {isEqual} from '../common';


// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (functionStr: number | string | undefined, data: Uint8Array) => void;
export type ErrorHandler = (functionStr: number | string | undefined, err: Error) => void;

export interface PollProps {
  // function address e.g "5a" or "33" or 27. Undefined means do poll without specifying a data address
  function?: string | number;
  dataLength?: number;
  interval?: number;
}

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  // TODO: почему poll обязательный???
  poll: PollProps[];
  // TODO: зачем нужно если можно определить тип по int и poll ????
  feedback?: FeedbackType;
  // Default poll interval. By default is 1000
  pollInterval: number;
}

export const UNDEFINED_DATA_ADDRESS = 'default';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {

  // TODO: почему называется functionStr ????


  /**
   * Write data to slave.
   * * write(functionStr, data) - write data to data address
   * * write(functionStr) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(functionStr?: string | number, data?: Uint8Array): Promise<void>;
  abstract read(functionStr?: string | number, length?: number): Promise<Uint8Array>;
  abstract request(functionStr?: string | number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;
  protected abstract doPoll(functionStr: string | number | undefined): Promise<Uint8Array>;
  protected abstract setupFeedback(): void;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly pollErrorEvents = new IndexedEvents<ErrorHandler>();
  protected readonly polling: Polling = new Polling();

  // last received data by polling by function number
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};
  protected readonly sender: Sender = this.newSender();


  // TODO: reivew
  init = async () => {
    // listen to errors which happen on polling
    for (let pollProps of this.props.poll) {
      const resolvedDataAddr: string = this.resolvefunctionStr(pollProps.function);

      this.polling.addListener((err: Error) => {
        const msg = `MasterSlaveBaseNodeDriver: Error on polling to function "${resolvedDataAddr}". Props are "${JSON.stringify(this.props)}": ${String(err)}`;

        this.pollErrorEvents.emit(resolvedDataAddr, new Error(msg));
      }, resolvedDataAddr);
    }
  }

  // TODO: review - наверное лучше запускать вручную
  // protected appDidInit = async () => {
  //   // start polling or int listeners after app is initialized
  //   this.setupFeedback();
  // }

  // destroy = () => {
  // }

  /**
   * Start feedback manually.
   * It will do the first poll and then start listening for int or do poll according props.
   */
  startFeedback() {
    // TODO: make poll once at the beginning and don't wait it????

    this.setupFeedback();
  }


  getLastData(functionStr: string | number | undefined): Uint8Array | undefined {
    const resolvedDataAddr: string = this.resolvefunctionStr(functionStr);

    return this.pollLastData[resolvedDataAddr];
  }

  hasFeedback(): boolean {
    return Boolean(this.props.int || this.props.poll);
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in poll prop.
   * It rejects promise on error
   */
  async pollOnce(): Promise<void> {
    if (!this.props.feedback) {
      throw new Error(
        `MasterSlaveBaseNodeDriver.poll: Feedback hasn't been configured. `
        + `Props are "${JSON.stringify(this.props)}"`
      );
    }

    for (let item of this.props.poll) {
      const resolvedDataAddr: string = this.resolvefunctionStr(item.function);

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
  protected pollAllFunctionNumbers = async () => {
    for (let item of this.props.poll) {
      try {
        await this.doPoll(item.function);
      }
      catch (err) {
        const resolvedDataAddr: string = this.resolvefunctionStr(item.function);

        this.pollErrorEvents.emit(resolvedDataAddr, err);
      }
    }
  }

  protected startPolls() {
    if (this.props.feedback !== 'poll') return;

    for (let item of this.props.poll) {
      this.startPollingOnFunctionNumber(item.function);
    }
  }

  protected stopPollings() {
    if (this.props.feedback !== 'poll') return;

    for (let item of this.props.poll) {
      const resolvedDataAddr: string = this.resolvefunctionStr(item.function);

      this.polling.stop(resolvedDataAddr);
    }
  }

  protected updateLastPollData(functionStr: number | string | undefined, data: Uint8Array) {
    const pollProps = this.getPollProps(functionStr);
    const resolvedDataAddr: string = this.resolvefunctionStr(functionStr);

    // do nothing if it isn't polling data address
    if (typeof functionStr === 'undefined' || !pollProps) return;

    // TODO: don't use isEqual
    // if data is equal to previous data - do nothing
    if (isEqual(this.pollLastData[resolvedDataAddr], data)) return;

    // save data
    this.pollLastData[resolvedDataAddr] = data;
    // finally rise an event
    this.pollEvents.emit(resolvedDataAddr, data);
  }

  protected makeFunctionHex(functionStr: string | number | undefined): number | undefined {
    if (typeof functionStr === 'undefined') return;

    return hexStringToHexNum(functionStr);
  }

  /**
   * Find poll props line {function, length, interval}
   * If functionStr is undefined then item with function = undefined will be found.
   */
  protected getPollProps(functionStr: string | number | undefined): PollProps | undefined {
    return findObj<PollProps>(this.props.poll, (item: PollProps) => {
      return item.function === functionStr;
    });
  }

  protected resolvefunctionStr(functionStr: number | string | undefined): string {
    if (typeof functionStr === 'undefined') return UNDEFINED_DATA_ADDRESS;

    return String(functionStr);
  }


  private startPollingOnFunctionNumber(functionStr: number | string | undefined) {
    const pollProps: PollProps | undefined = this.getPollProps(functionStr);

    if (!pollProps) {
      throw new Error(`MasterSlaveBaseNodeDriver.startPolling: Can't find poll props of data address "${functionStr}"`);
    }

    const pollInterval: number = (typeof pollProps.interval === 'undefined')
      ? this.props.pollInterval
      : pollProps.interval;
    const resolvedDataAddr: string = this.resolvefunctionStr(functionStr);

    // TODO: может выполнять pollAllFunctionNumbers? тогда не получится указать pollInterval на каждый полинг

    this.polling.start(
      () => this.doPoll(functionStr),
      pollInterval,
      resolvedDataAddr
    );
  }

}
