import DriverBase from '../../base/DriverBase';
import IndexedEvents from '../IndexedEvents';
import Polling from '../Polling';
import Sender from '../Sender';
import {hexStringToHexNum, isEqualUint8Array, normalizeHexString} from '../binaryHelpers';
import Context from '../../Context';
import EntityDefinition from '../../interfaces/EntityDefinition';


// type of feedback - polling or interruption
export type FeedbackType = 'poll' | 'int';
export type Handler = (functionHex: number | undefined, data: Uint8Array) => void;

export interface PollProps {
  // data length to read at poll
  dataLength?: number;
  interval?: number;
}

export interface MasterSlaveBaseProps {
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  // parameters of functions to poll or read like { '0x5c': { dataLength: 1 } }
  poll: {[index: string]: PollProps};
  feedback?: FeedbackType;
  // Default poll interval. By default is 1000
  defaultPollIntervalMs: number;
}

export const UNDEFINED_DATA_ADDRESS = '*';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Normalize functions address string.
   */
  static transformDefinition(definition: EntityDefinition): EntityDefinition {
    if (!definition.props.poll) return definition;

    const poll: {[index: string]: PollProps} = {};

    for (let index of Object.keys(definition.props.poll)) {
      if (index === UNDEFINED_DATA_ADDRESS) {
        poll[index] = definition.props.poll[index];

        continue;
      }

      poll[normalizeHexString(index)] = definition.props.poll[index];
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
  abstract write(functionHex?: number, data?: Uint8Array): Promise<void>;
  abstract read(functionHex?: number, length?: number): Promise<Uint8Array>;
  abstract transfer(functionHex?: number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;

  protected abstract doPoll(functionHex?: number): Promise<Uint8Array>;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly polling: Polling = new Polling();
  protected readonly sender: Sender = this.newSender();

  // last received data by polling by function number.
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, MasterSlaveBaseNodeDriver.transformDefinition(definition));
  }

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
    if (this.props.feedback === 'int') {
      this.pollAllFunctions();
    }
    else if (this.props.feedback === 'poll') {
      // restart polling - it will make a new request and restart interval
      for (let functionStr of Object.keys(this.props.poll)) {
        await this.polling.restart(functionStr);
      }
    }
    else {
      throw new Error(
        `MasterSlaveBaseNodeDriver.poll: Feedback hasn't been configured. `
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


  /**
   * Poll all the defined polling to data addresses by turns and don't stop on errors.
   */
  protected pollAllFunctions = async () => {
    for (let functionStr of Object.keys(this.props.poll)) {
      const functionHex: number | undefined = this.functionStrToHex(functionStr);

      try {
        await this.doPoll(functionHex);
      }
      catch (err) {
        this.log.error(`Error occur on functionNum ${functionStr}, ${err}`);
      }
    }
  }

  /**
   * Start poll intervals if feedback is poll.
   */
  protected startPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let functionStr of Object.keys(this.props.poll)) {
      const functionHex: number | undefined = this.functionStrToHex(functionStr);
      const pollProps: PollProps = this.props.poll[functionStr];
      const pollInterval: number = (typeof pollProps.interval === 'undefined')
        ? this.props.defaultPollIntervalMs
        : pollProps.interval;

      this.polling.start(() => this.doPoll(functionHex), pollInterval, functionStr);
    }
  }

  protected stopPollIntervals() {
    if (this.props.feedback !== 'poll') return;

    for (let functionStr of Object.keys(this.props.poll)) {
      this.polling.stop(functionStr);
    }
  }

  protected handlePoll(functionHex: number | undefined, incomeData: Uint8Array) {
    const functionStr: string = this.functionHexToStr(functionHex);

    // do nothing if it isn't polling data address or data is equal to previous data
    if (
      !this.props.poll[functionStr]
      || isEqualUint8Array(this.pollLastData[functionStr], incomeData)
    ) return;

    // save data
    this.pollLastData[functionStr] = incomeData;
    // finally rise an event
    this.pollEvents.emit(functionHex, incomeData);
  }

  protected functionStrToHex(functionStr: string): number | undefined {
    if (functionStr === UNDEFINED_DATA_ADDRESS) return;

    return hexStringToHexNum(functionStr);
  }

  /**
   * Convert like 47 => "2f"
   */
  protected functionHexToStr(functionHex?: number): string {
    if (typeof functionHex === 'undefined') return UNDEFINED_DATA_ADDRESS;

    return functionHex.toString(16);
  }

}


// getLastData(functionStr: string | number | undefined): Uint8Array | undefined {
//   const resolvedDataAddr: string = this.resolveFunctionStr(functionStr);
//
//   return this.pollLastData[resolvedDataAddr];
// }
