import DriverBase from '../app/entities/DriverBase';
import IndexedEvents from '../helpers/IndexedEvents';
import Poling from '../helpers/Poling';
import Sender from '../helpers/Sender';
import {ImpulseInputDriver, ImpulseInputDriverProps} from '../drivers/Binary/ImpulseInput.driver';
import {GetDriverDep} from '../app/entities/EntityBase';
import MasterSlaveBusProps from '../app/interfaces/MasterSlaveBusProps';
import {isEqual} from '../helpers/lodashLike';


export type Handler = (data: Uint8Array) => void;
export type ErrorHandler = (err: Error) => void;

export interface MasterSlaveBaseProps extends MasterSlaveBusProps {
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputDriverProps;
  // length of data which will be requested
  pollDataLength: number;
  pollDataAddress?: string | number;
  // TODO: указать длины для data adresses
}

const DEFAULT_POLL_ID = 'default';


export default class MasterSlaveBaseNodeDriver<T extends MasterSlaveBaseProps> extends DriverBase<T> {
  private readonly pollEvents: IndexedEvents = new IndexedEvents();
  private readonly pollErrorEvents: IndexedEvents = new IndexedEvents();
  private readonly poling: Poling = new Poling();
  // data addr in hex to use in poling.
  private pollDataAddressHex?: number;
  private pollId: string = DEFAULT_POLL_ID;
  protected sender?: Sender;

  // last received data by poling
  // it needs to decide to rise change event or not
  private pollLastData: Uint8Array = new Uint8Array(0);

  private get impulseInput(): ImpulseInputDriver | undefined {
    return this.depsInstances.impulseInput as ImpulseInputDriver | undefined;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    if (this.props.int) {
      this.depsInstances.impulseInput = await getDriverDep('ImpulseInput.driver')
        .getInstance(this.props.int || {});
    }

    this.pollDataAddressHex = this.parseDataAddress(this.props.pollDataAddress);
    this.pollId = this.dataAddressToString(this.props.pollDataAddress);
    this.sender = new Sender(
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

  getLastData(): Uint8Array {
    return this.pollLastData;
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


  protected stopPoling() {
    if (this.props.feedback !== 'poll') return;

    this.poling.stop(this.pollId);
  }

  protected startPoling() {
    if (this.props.feedback !== 'poll') return;

    this.poling.start(this.doPoll, this.props.pollInterval, this.pollId);
  }

  protected updateLastPollData(data: Uint8Array) {
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

      this.impulseInput.addListener(this.doPoll);
    }
    // start poling if feedback is poll
    this.startPoling();
    // else don't use feedback at all
  }

  /**
   * Convert string or number data address to hex.
   * Undefined means no data address.
   */
  private parseDataAddress(dataAddressStr: string | number | undefined): number | undefined {
    if (typeof dataAddressStr === 'undefined') return undefined;

    return parseInt(String(dataAddressStr), 16);
  }

}
