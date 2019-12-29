import DriverBase from '../../base/DriverBase';
import IndexedEvents from '../IndexedEvents';
import Polling from '../Polling';
import Sender from '../Sender';
import {findObj} from '../objects';
import {hexStringToHexNum} from '../binaryHelpers';
import {isEqual} from '../common';


// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (functionHex: number | undefined, data: Uint8Array) => void;
//export type ErrorHandler = (functionHex: number | undefined, err: Error) => void;

export interface PollProps {
  // TODO: должен быть только number чтобы его можно было найти
  // function address e.g "5a" or "33" or 27. Undefined means do poll without specifying a data address
  //function?: string | number;
  // data length to read at poll
  dataLength?: number;
  interval?: number;
}

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  feedback?: FeedbackType;
  // TODO: rename to readProps etc or functionRead or just functions
  // parameters of functions to poll or read like { '0x5c': { dataLength: 1 } }
  poll: {[index: string]: PollProps};
  // TODO: does it need ?
  // Default poll interval. By default is 1000
  pollInterval: number;
}

const UNDEFINED_DATA_ADDRESS = '*';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Write data to slave.
   * * write(functionHex, data) - write data to data address
   * * write(functionHex) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(functionHex?: number, data?: Uint8Array): Promise<void>;
  abstract read(functionHex?: number, length?: number): Promise<Uint8Array>;
  abstract transfer(functionHex?: number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;

  /**
   * Start feedback manually.
   * It will do the first poll and then start listening for int or do poll according props.
   */
  startFeedback?(): void;

  protected abstract doPoll(functionHex?: number): Promise<Uint8Array>;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly polling: Polling = new Polling();
  protected readonly sender: Sender = this.newSender();

  // TODO: does it really need???
  // last received data by polling by function number
  // it needs to decide to rise change event or not
  //private pollLastData: {[index: string]: Uint8Array} = {};


  async init() {
    // listen to errors which happen on polling
    for (let functionStr of Object.keys(this.props.poll)) {
      this.polling.addListener((err: Error) => {
        this.log.error(
          `MasterSlaveBaseNodeDriver: Error on polling to function "${functionStr}". ` +
          `Props are "${JSON.stringify(this.props)}": ${String(err)}`
        );
      }, functionStr);
    }
  }

  destroy = async () => {
    this.pollEvents.destroy();
    this.polling.destroy();
  }


  hasFeedback(): boolean {
    return Boolean(this.props.feedback);
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

    // TODO: why not use pollAllFunctions ????
    // read all the read functions
    for (let functionStr of Object.keys(this.props.poll)) {
      // TODO: why use polling - if feedback int - maybe not to use it - just request
      await this.polling.restart(functionStr);
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

  // TODO: review
  /**
   * Poll all the defined polling to data addresses
   */
  protected pollAllFunctions = async () => {
    for (let functionStr of Object.keys(this.props.poll)) {
      try {
        await this.doPoll(functionStr);
      }
      catch (err) {
        this.log.error(`Error occur on functionNum ${functionStr}, ${err}`);
      }
    }
  }

  // TODO: review
  protected startPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let functionStr of Object.keys(this.props.poll)) {
      this.startPollingOnFunctionNumber(functionStr);
    }
  }

  protected stopPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let functionStr of Object.keys(this.props.poll)) {
      this.polling.stop(functionStr);
    }
  }

  // TODO: review
  protected updateLastPollData(functionStr: number | string | undefined, data: Uint8Array) {
    const pollProps = this.getPollProps(functionStr);
    const resolvedDataAddr: string = this.resolveFunctionStr(functionStr);

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

  // TODO: review
  protected makeFunctionHex(functionStr: string | number | undefined): number | undefined {
    if (typeof functionStr === 'undefined') return;

    return hexStringToHexNum(functionStr);
  }

  /**
   * Find poll props line {function, length, interval}
   * If functionStr is undefined then item with function = undefined will be found.
   */
  protected getPollProps(functionStr?: number): PollProps | undefined {

    // TODO: review
    // TODO: нужно заранее преобразовать номера ф-й в hex
    // TODO: найти тот объект где functionStr = undefined

    return findObj<PollProps>(this.props.poll, (item: PollProps) => {
      return item.function === functionStr;
    });
  }

  protected resolveFunctionStr(functionHex?: number): string {
    if (typeof functionHex === 'undefined') return UNDEFINED_DATA_ADDRESS;

    return functionHex.toString(16);
  }


  // TODO: review
  private startPollingOnFunctionNumber(functionStr: string) {
    const pollProps: PollProps | undefined = this.getPollProps(functionStr);

    if (!pollProps) {
      throw new Error(`MasterSlaveBaseNodeDriver.startPolling: Can't find poll props of data address "${functionStr}"`);
    }

    const pollInterval: number = (typeof pollProps.interval === 'undefined')
      ? this.props.pollInterval
      : pollProps.interval;
    const resolvedDataAddr: string = this.resolveFunctionStr(functionStr);

    // TODO: может выполнять pollAllFunctionNumbers? тогда не получится указать pollInterval на каждый полинг

    this.polling.start(
      () => this.doPoll(functionStr),
      pollInterval,
      resolvedDataAddr
    );
  }

}


// TODO: review - наверное лучше запускать вручную
// protected appDidInit = async () => {
//   // start polling or int listeners after app is initialized
//   this.setupFeedback();
// }

// TODO: review
// getLastData(functionStr: string | number | undefined): Uint8Array | undefined {
//   const resolvedDataAddr: string = this.resolveFunctionStr(functionStr);
//
//   return this.pollLastData[resolvedDataAddr];
// }

// /**
//  * Listen to errors which take place while polling or interruption is in progress
//  */
// addPollErrorListener(handler: ErrorHandler): number {
//   return this.pollErrorEvents.addListener(handler);
// }
//
// removePollErrorListener(handlerIndex: number): void {
//   this.pollErrorEvents.removeListener(handlerIndex);
// }
