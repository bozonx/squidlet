
// TODO: remove - use SemiDuplexFeedback driver

import DriverBase from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import Polling from '../../../../../squidlet-lib/src/Polling';
import Sender from '../../../../../squidlet-lib/src/Sender';
import {
  hexNumToString,
  isEqualUint8Array,
  stringToUint8Array
} from '../../../../../squidlet-lib/src/binaryHelpers';
import Context from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import EntityDefinition from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';


export interface PollPreProps {
  // data to write before read or function number to read from
  request?: Uint8Array | string | number;
  requestCb?: () => Promise<Uint8Array>;
  // length of result which will be read. If isn't set then `defaultPollIntervalMs` will be used.
  resultLength?: number;
  // poll interval if polling is used in ms
  intervalMs?: number;
}

export interface PollProps {
  request?: Uint8Array;
  requestCb?: () => Promise<Uint8Array>;
  // string variant of request. Useful for print into messages. It will be generated in constructor
  requestStr?: string;
  resultLength?: number;
  intervalMs?: number;
}

// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (data: Uint8Array, pollProps: PollProps) => void;

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  poll: PollPreProps[];
  feedback?: FeedbackType;
  // Default poll interval. By default is 1000
  defaultPollIntervalMs: number;
}


// TODO: validate that props has to have feedback and poll together or no one or them
// TODO: validate poll props

export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Normalize functions address string.
   */
  static transformDefinition(definition: EntityDefinition): EntityDefinition {
    if (!definition.props.poll) return definition;

    const definitionPoll: PollPreProps[] = definition.props.poll;
    const poll: PollProps[] = [];

    for (let item of definitionPoll) {
      let request: Uint8Array | undefined;
      let requestStr: string | undefined;

      if (typeof item.request === 'number') {
        request = new Uint8Array([item.request]);
        requestStr = hexNumToString(item.request);
      }
      else if (typeof item.request === 'string') {
        request = new Uint8Array(stringToUint8Array(item.request));
        requestStr = item.request;
      }
      else if (item.request instanceof Uint8Array) {
        request = item.request;
        requestStr = JSON.stringify(item.request);
      }
      else if (Array.isArray(item.request)) {
        request = new Uint8Array(item.request);
        requestStr = JSON.stringify(item.request);
      }
      else if (typeof item.request === 'undefined') {
        // do nothing
      }
      else {
        throw new Error(`Unknown type of poll request`);
      }

      poll.push({
        ...item,
        request,
        requestStr,
      });
    }

    return {
      ...definition,
      props: {
        ...definition.props,
        poll,
      }
    };
  }


  /**
   * Write data to slave.
   * * write(functionHex, data) - write data to data address
   * * write(functionHex) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(data: Uint8Array): Promise<void>;
  abstract read(length: number): Promise<Uint8Array>;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly polling: Polling = new Polling();
  protected readonly sender: Sender;

  // last received data by polling by function number.
  // it needs to decide to rise change event or not
  private pollLastData: Uint8Array[] = [];


  constructor(context: Context, definition: EntityDefinition) {
    super(context, MasterSlaveBaseNodeDriver.transformDefinition(definition));

    this.sender = new Sender(
      this.context.config.config.requestTimeoutSec,
      this.context.config.config.senderResendTimeout,
      this.context.log.debug,
      this.context.log.warn
    );
  }

  async init() {
    if (!this.props.poll) return;

    // listen to errors which happen on polling
    for (let indexStr in this.props.poll) {
      this.polling.addListener((err: Error | undefined) => {
        if (!err) return;

        const pollProps = this.props.poll[indexStr] as PollProps;

        this.log.error(
          `MasterSlaveBaseNodeDriver: Error on request "${pollProps.requestStr || indexStr}". ` +
          `Props are "${JSON.stringify(this.props)}": ${String(err)}`
        );
      }, indexStr);
    }
  }

  destroy = async () => {
    this.pollEvents.destroy();
    this.polling.destroy();
    this.sender.destroy();
  }


  hasFeedback(): boolean {
    return Boolean(this.props.feedback);
  }

  async transfer(request: Uint8Array, readLength: number): Promise<Uint8Array> {
    // write request
    await this.write(request);
    // read result
    return this.read(readLength);
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in poll prop.
   * It rejects promise on error
   */
  async pollOnce(): Promise<void> {
    if (!this.props.poll) throw new Error(`MasterSlaveBaseNodeDriver.pollOnce: no poll in props`);

    if (this.props.feedback === 'int') {
      this.pollAllFunctions();
    }
    else if (this.props.feedback === 'poll') {
      // TODO: review indexStr
      // TODO: review restart - он вообще ожидает выполнения ????

      // restart polling - it will make a new request and restart interval
      for (let indexStr in this.props.poll) {

        // TODO: не ждет завершения
        // TODO: нужно ждать ближайшего результата !!!!

        await this.polling.restart(indexStr);

        await new Promise((resolve, reject) => {

          // TODO: add timeout

          this.polling.addListener((err: Error | undefined, result: any) => {
            if (err) {
              return reject(err);
            }

            resolve();
          }, indexStr);
        });
      }
    }
    else {
      throw new Error(
        `MasterSlaveBaseNodeDriver.pollOnce: Feedback hasn't been configured. `
        + `Props are "${JSON.stringify(this.props)}"`
      );
    }

  }

  /**
   * Start feedback manually.
   * It will do the first poll and then start listening for int or do poll according props.
   * Override this method to start "int" listening.
   */
  startFeedback(): void {
    // start polling if feedback is poll
    this.startPollIntervals();
    // else don't use feedback at all
  }

  stopFeedBack(): void {
    this.stopPollIntervals();
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
   * Poll all the defined polling to data addresses by turns and don't stop on errors.
   */
  protected pollAllFunctions = async () => {
    for (let indexStr in this.props.poll) {
      try {
        await this.doPoll(parseInt(indexStr));
      }
      catch (err) {
        const pollProps = this.props.poll[indexStr] as PollProps;

        this.log.error(`Error occur on request ${pollProps.requestStr || indexStr}, ${err}`);
      }
    }
  }

  /**
   * Start poll intervals if feedback is poll.
   */
  protected startPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let indexStr in this.props.poll) {
      const pollProps = this.props.poll[indexStr] as PollProps;
      const pollInterval: number = (typeof pollProps.intervalMs === 'undefined')
        ? this.props.defaultPollIntervalMs
        : pollProps.intervalMs;

      this.polling.start(
        () => this.doPoll(parseInt(indexStr)),
        pollInterval,
        indexStr
      );
    }
  }

  protected stopPollIntervals() {
    if (this.props.feedback !== 'poll' || !this.props.poll) return;

    for (let indexStr in this.props.poll) {
      this.polling.stop(indexStr);
    }
  }

  protected async doPoll(pollIndex: number): Promise<void> {
    if (!this.props.poll) throw new Error(`No poll in props`);

    const pollProps = this.props.poll[pollIndex] as PollProps;
    let result: Uint8Array;

    if (pollProps.requestCb) {
      result = await pollProps.requestCb();
    }
    else if (pollProps.request) {
      const resolvedLength: number = (typeof pollProps.resultLength === 'undefined')
        ? this.props.defaultPollIntervalMs
        : pollProps.resultLength;

      if (pollProps.request.length) {
        // write request and read result
        result = await this.transfer(pollProps.request, resolvedLength);
      }
      else {
        // read for data
        result = await this.read(resolvedLength);
      }
    }
    else {
      throw new Error(`Can't resolve request of ${JSON.stringify(pollProps)}`);
    }

    this.handleIncomeData(result, pollIndex);
  }

  protected handleIncomeData(incomeData: Uint8Array, pollIndex: number) {


    // TODO: почему решает что данные одинаковые ????
    //  наверное потомучто раньше они уже установились

    if (!this.props.poll) return;
    // do nothing if it isn't polling data address or data is equal to previous data
    else if (
      !this.props.poll[pollIndex]
      // TODO: раскоментировать
      //|| isEqualUint8Array(this.pollLastData[pollIndex], incomeData)
    ) return;

    // save data
    this.pollLastData[pollIndex] = incomeData;
    // finally rise an event
    this.pollEvents.emit(incomeData, this.props.poll[pollIndex] as PollProps);
  }

}

//export const UNDEFINED_DATA_ADDRESS = '*';
// private resolveReadLength(request: Uint8Array, readLength?: number): number {
//   if (typeof readLength !== 'undefined') {
//     return readLength;
//   }
//
//   const pollIndex: number | undefined = this.resolveReadLength(request);
//
//   if (typeof pollIndex === 'undefined') {
//     throw new Error(`Can't find poll props of request "${JSON.stringify(request)}"`);
//   }
//
//   const pollProps = this.props.poll[pollIndex] as PollProps;
//
//   if (!pollProps.resultLength) {
//     throw new Error(`I2cToSlaveDriver: Can't resolve length of data of requst "${JSON.stringify(request)}"`);
//   }
//
//   return pollProps.resultLength;
// }

// protected functionStrToHex(functionStr: string): number | undefined {
//   if (functionStr === UNDEFINED_DATA_ADDRESS) return;
//
//   return hexStringToHexNum(functionStr);
// }
//
// /**
//  * Convert like 47 => "2f"
//  */
// protected functionHexToStr(functionHex?: number): string {
//   if (typeof functionHex === 'undefined') return UNDEFINED_DATA_ADDRESS;
//
//   return functionHex.toString(16);
// }

// getLastData(functionStr: string | number | undefined): Uint8Array | undefined {
//   const resolvedDataAddr: string = this.resolveFunctionStr(functionStr);
//
//   return this.pollLastData[resolvedDataAddr];
// }
