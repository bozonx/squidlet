import DriverBase from '../../base/DriverBase';
import IndexedEvents from '../IndexedEvents';
import Polling from '../Polling';
import Sender from '../Sender';
import {
  hexNumToString,
  hexStringToHexNum,
  isEqualUint8Array,
  normalizeHexString,
  stringToUint8Array
} from '../binaryHelpers';
import Context from '../../Context';
import EntityDefinition from '../../interfaces/EntityDefinition';


export interface PollPreProps {
  // data to write before read or function number to read from
  request: Uint8Array | string | number;
  // length of result which will be read. If isn't set then `defaultPollIntervalMs` will be used.
  resultLength?: number;
  // poll interval if polling is used
  interval?: number;
}

export interface PollProps {
  request: Uint8Array;
  // string variant of request. Useful for print into messages.
  requestStr: string;
  resultLength?: number;
  interval?: number;
}

// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (data: Uint8Array, pollProps: PollProps) => void;

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  poll: PollProps[];
  feedback?: FeedbackType;
  // Default poll interval. By default is 1000
  defaultPollIntervalMs: number;
}

export const UNDEFINED_DATA_ADDRESS = '*';


// TODO: validate that props has to have feedback and poll together or no one or them
// TODO: validate poll props

export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Normalize functions address string.
   */
  static transformDefinition(definition: EntityDefinition): EntityDefinition {
    if (!definition.props.poll) return definition;

    const definitionPoll: PollProps[] = definition.props.poll;
    const poll: PollProps[] = [];

    for (let item of definitionPoll) {
      let request: Uint8Array = item.request;
      let requestStr: string = String(item.request);

      if (typeof item.request === 'number') {
        request = new Uint8Array([item.request]);
        requestStr = hexNumToString(item.request);
      }
      else if (typeof item.request === 'string') {
        request = new Uint8Array(stringToUint8Array(item.request));
      }
      else if (Array.isArray(item.request)) {
        request = new Uint8Array(item.request);
        requestStr = JSON.stringify(item.request);
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
  abstract read(length?: number): Promise<Uint8Array>;
  abstract transfer(dataToSend: Uint8Array, readLength?: number): Promise<Uint8Array>;

  protected abstract doPoll(pollIndex: number): Promise<Uint8Array>;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly polling: Polling = new Polling();
  protected readonly sender: Sender = this.newSender();

  // last received data by polling by function number.
  // it needs to decide to rise change event or not
  private pollLastData: Uint8Array[] = [];


  constructor(context: Context, definition: EntityDefinition) {
    super(context, MasterSlaveBaseNodeDriver.transformDefinition(definition));
  }

  async init() {
    if (!this.props.poll) return;

    // listen to errors which happen on polling
    for (let indexStr in this.props.poll) {
      this.polling.addListener((err: Error | undefined) => {
        if (err) {
          this.log.error(
            `MasterSlaveBaseNodeDriver: Error on request "${this.props.poll[indexStr].request}". ` +
            `Props are "${JSON.stringify(this.props)}": ${String(err)}`
          );
        }
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
      // restart polling - it will make a new request and restart interval
      for (let indexStr in this.props.poll) {
        await this.polling.restart(indexStr);
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
   * Poll all the defined polling to data addresses by turns and don't stop on errors.
   */
  protected pollAllFunctions = async () => {
    for (let index in this.props.poll) {
      try {
        await this.doPoll(parseInt(index));
      }
      catch (err) {
        this.log.error(`Error occur on request ${this.props.poll[index].request}, ${err}`);
      }
    }
  }

  /**
   * Start poll intervals if feedback is poll.
   */
  protected startPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let indexStr in this.props.poll) {
      const pollProps: PollProps = this.props.poll[indexStr];
      const pollInterval: number = (typeof pollProps.interval === 'undefined')
        ? this.props.defaultPollIntervalMs
        : pollProps.interval;

      this.polling.start(() => this.doPoll(parseInt(indexStr)), pollInterval, indexStr);
    }
  }

  protected stopPollIntervals() {
    if (this.props.feedback !== 'poll' || !this.props.poll) return;

    for (let indexStr in this.props.poll) {
      this.polling.stop(indexStr);
    }
  }

  protected handlePoll(incomeData: Uint8Array, pollIndex: number) {
    if (!this.props.poll) return;
    // do nothing if it isn't polling data address or data is equal to previous data
    if (
      !this.props.poll[pollIndex]
      || isEqualUint8Array(this.pollLastData[pollIndex], incomeData)
    ) return;

    // save data
    this.pollLastData[pollIndex] = incomeData;
    // finally rise an event
    this.pollEvents.emit(incomeData, this.props.poll[pollIndex]);
  }

}


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
