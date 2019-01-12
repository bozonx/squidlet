import DriverBase from '../app/entities/DriverBase';
import IndexedEvents from '../helpers/IndexedEvents';
import Poling from '../helpers/Poling';
import Sender from '../helpers/Sender';
import {ImpulseInputDriver, ImpulseInputDriverProps} from '../drivers/Binary/ImpulseInput.driver';
import {GetDriverDep} from '../app/entities/EntityBase';
import MasterSlaveBusProps from '../app/interfaces/MasterSlaveBusProps';
import {isEqual} from '../helpers/lodashLike';
import {hexStringToHexNum} from '../helpers/binaryHelpers';


export type Handler = (dataAddress: number, data: Uint8Array) => void;
export type ErrorHandler = (err: Error) => void;

export interface MasterSlaveBaseProps extends MasterSlaveBusProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // length of data which will be requested
  // pollDataLength: number;
  // pollDataAddress?: string | number;

  poll: {dataAddress: number | string, length: string, interval?: number}[];
}

const DEFAULT_POLL_ID = 'default';


export default abstract class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  /**
   * Write data to slave.
   * * write(dataAddress, data) - write data ti data address
   * * write(dataAddress) - write just 1 byte - data address
   * * write() - write an empty
   * * write(undefined, data) - write only data
   */
  abstract write(dataAddress?: number, data?: Uint8Array): Promise<void>;
  abstract read(dataAddress?: number, length?: number): Promise<Uint8Array>;
  abstract request(dataAddress?: number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;
  protected abstract doPoll: (dataAddress: number) => Promise<Uint8Array>;

  protected readonly pollEvents: IndexedEvents = new IndexedEvents();
  protected readonly pollErrorEvents: IndexedEvents = new IndexedEvents();
  protected readonly poling: Poling = new Poling();

  // last received data by poling by dataAddress
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};
  private _sender?: Sender;

  protected get sender(): Sender {
    return this._sender as Sender;
  }

  private get impulseInput(): ImpulseInputDriver | undefined {
    return this.depsInstances.impulseInput as ImpulseInputDriver | undefined;
  }


  // TODO: setup poll on several data address
  // TODO: поддержка poll interval на каждом data address

  protected doInit = async (getDriverDep: GetDriverDep) => {
    if (this.props.int) {
      this.depsInstances.impulseInput = await getDriverDep('ImpulseInput.driver')
        .getInstance(this.props.int || {});
    }

    for (let item of this.props.poll) {
      this.pollLastData[item.dataAddress] = new Uint8Array(0);
    }

    this._sender = new Sender(
      // TODO: don't use system.host
      this.env.system.host.config.config.senderTimeout,
      this.env.system.host.config.config.senderResendTimeout
    );
  }

  protected appDidInit = async () => {
    // start poling or int listeners after app is initialized
    this.setupFeedback();
  }


  destroy = () => {
    // TODO: удалить из pollLengths, Polling
    // TODO: удалить из intListenersLengths, unlisten of driver
  }

  getLastData(dataAddress: number): Uint8Array {
    return this.pollLastData[dataAddress];
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

    const pollId: string = this.dataAddressToString();

    // TODO: проверить что не будут выполняться другие poll пока выполняется текущий

    return this.poling.restart(this.pollId);
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


  protected startPoling(dataAddress: number | string) {
    if (this.props.feedback !== 'poll') return;

    const pollId: string = this.dataAddressToString(dataAddress);

    this.poling.start(() => this.doPoll(dataAddress), this.props.pollInterval, pollId);
  }

  protected stopPoling(dataAddress: number | string) {
    if (this.props.feedback !== 'poll') return;

    const pollId: string = this.dataAddressToString(dataAddress);

    this.poling.stop(pollId);
  }

  protected updateLastPollData(data: Uint8Array) {

    // TODO: review

    // if data is equal to previous data - do nothing
    if (isEqual(this.pollLastData, data)) return;

    // save data
    this.pollLastData = data;
    // finally rise an event
    this.pollEvents.emit(data);
  }

  /**
   * Convert number to string or undefined to "DEFAULT_POLL_ID"
   */
  protected dataAddressToString(dataAddress: string | number | undefined): string {
    if (typeof dataAddress === 'undefined') return DEFAULT_POLL_ID;
    if (typeof dataAddress === 'string') return dataAddress;

    return dataAddress.toString(16);
  }


  private setupFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `I2cNode.setupFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseInput.addListener(async () => {
        for (let item of this.props.poll) {
          await this.doPoll(this.makeDataAddressesHexNum((item.dataAddress));
        }
      });
    }
    // start poling if feedback is poll
    for (let item of this.props.poll) {
      this.startPoling(item.dataAddress);
    }

    // else don't use feedback at all
  }
  
  private makeDataAddressesHexNum(dataAddrStr: string | number): number {
    return hexStringToHexNum(dataAddrStr);
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

}
