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
export type ErrorHandler = (dataAddress: number, err: Error) => void;

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
  abstract write(dataAddressStr?: string | number, data?: Uint8Array): Promise<void>;
  abstract read(dataAddressStr?: string | number, length?: number): Promise<Uint8Array>;
  abstract request(dataAddressStr?: string | number, dataToSend?: Uint8Array, readLength?: number): Promise<Uint8Array>;
  protected abstract doPoll: (dataAddressStr: string | number) => Promise<Uint8Array>;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly pollErrorEvents = new IndexedEvents<ErrorHandler>();
  protected readonly poling: Poling = new Poling();

  // last received data by poling by dataAddress
  // it needs to decide to rise change event or not
  private pollLastData: {[index: string]: Uint8Array} = {};
  private _sender?: Sender;
  private impulseInput?: ImpulseInputDriver;

  protected get sender(): Sender {
    return this._sender as Sender;
  }


  // TODO: наверное не нужно конвертировать data address для pollId - или сделать отдельный метод

  protected doInit = async (getDriverDep: GetDriverDep) => {
    if (this.props.int) {
      this.impulseInput = await getDriverDep('ImpulseInput.driver')
        .getInstance(this.props.int || {});
    }

    // for (let item of this.props.poll) {
    //   this.pollLastData[item.dataAddress] = new Uint8Array(0);
    // }

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

  getLastData(dataAddressStr: string | number): Uint8Array {
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

    // TODO: проверить что не будут выполняться другие poll пока выполняется текущий

    for (let item of this.props.poll) {
      const pollId: string = this.dataAddressToString(item.dataAddress);

      await this.poling.restart(pollId);
    }
  }

  /**
   * Listen to data which received by polling or interruption.
   */
  addListener(handler: Handler): number {

    // TODO: review

    return this.pollEvents.addListener(handler);
  }

  removeListener(handlerIndex: number): void {
    this.pollEvents.removeListener(handlerIndex);
  }

  /**
   * Listen to errors which take place while poling or interruption is in progress
   */
  addPollErrorListener(handler: ErrorHandler): number {

    // TODO: review

    return this.pollErrorEvents.addListener(handler);
  }

  removePollErrorListener(handlerIndex: number): void {
    this.pollErrorEvents.removeListener(handlerIndex);
  }


  protected startPoling(dataAddressStr: number | string) {
    if (this.props.feedback !== 'poll') return;

    const pollId: string = this.dataAddressToString(dataAddressStr);
    //const pollInterval: number = if (typeof this.props.poll)
    // TODO: поддержка poll interval на каждом data address

    this.poling.start(() => this.doPoll(dataAddressStr), this.props.pollInterval, pollId);
  }

  protected stopPoling(dataAddressStr: number | string) {
    if (this.props.feedback !== 'poll') return;

    const pollId: string = this.dataAddressToString(dataAddressStr);

    this.poling.stop(pollId);
  }

  protected updateLastPollData(dataAddressStr: number | string, data: Uint8Array) {

    // TODO: review

    // if data is equal to previous data - do nothing
    if (isEqual(this.pollLastData, data)) return;

    // save data
    this.pollLastData[dataAddressStr] = data;
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
          `MasterSlaveBaseNodeDriver.setupFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
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

  // private pollAllTheDataAddresses() {
  //
  // }

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
