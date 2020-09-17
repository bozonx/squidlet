import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import Polling from 'system/lib/Polling';
import Sender from 'system/lib/Sender';
import {isEqualUint8Array} from 'system/lib/binaryHelpers';

import {ImpulseInput, ImpulseInputProps} from '../ImpulseInput/ImpulseInput';
import {makeUniqId} from '../../../system/lib/uniqId';


export type Handler = (data: Uint8Array) => void;
export type RequestDataCb = () => Promise<Uint8Array>;

export interface Props {
  feedbackId: string;

  pollIntervalMs: number;
  int?: ImpulseInputProps;
}


/**
 * It will start polling of listening of interruption.
 * At each poll action the specified callback will be used.
 * To use interruption set up "int" props.
 * To use polling don't defined "int" props.
 */
export class SemiDuplexFeedback extends DriverBase<Props> {
  private impulseInputDriver?: ImpulseInput;
  private impulseHandlerIndex?: number;
  private requestDataCb?: RequestDataCb;
  private readonly pollEvents = new IndexedEvents<Handler>();
  private readonly polling: Polling = new Polling();
  private sender!: Sender;

  // The latest received data by calling requestDataCb.
  // it needs to decide to rise change event or not
  private pollLastData?: Uint8Array;


  init = async () => {
    this.sender = new Sender(
      this.context.config.config.requestTimeoutSec,
      this.context.config.config.senderResendTimeout,
      this.context.log.debug,
      this.context.log.warn
    );

    if (this.props.int) {
      this.impulseInputDriver = await this.context.getSubDriver<ImpulseInput>(
        'ImpulseInput',
        this.props.int
      );
    }
  }

  destroy = async () => {
    this.pollEvents.destroy();
    this.polling.destroy();
    this.sender.destroy();

    delete this.impulseInputDriver;
  }


  isFeedbackStarted(): boolean {
    if (this.props.int) {
      return typeof this.impulseHandlerIndex !== 'undefined';
    }

    return this.polling.isInProgress();
  }

  startFeedback(requestDataCb: RequestDataCb): void {
    this.requestDataCb = requestDataCb;

    if (this.props.int) {
      if (!this.impulseInputDriver) {
        throw new Error(
          `SemiDuplexFeedback.startFeedback. ` +
          `impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseHandlerIndex = this.impulseInputDriver.onChange(() => {

        // TODO: может не делать новые запросы пока текущий в процессе ???

        this.doPoll()
          .catch(this.log.error);
      });

      return;
    }
    // start polling if feedback is not int
    this.polling.start(this.doPoll, this.props.pollIntervalMs);
  }

  stopFeedBack() {
    if (this.props.int) {
      if (!this.impulseHandlerIndex) return;

      this.impulseInputDriver && this.impulseInputDriver
        .removeListener(this.impulseHandlerIndex);

      delete this.impulseHandlerIndex;

      return;
    }
    // stop poling if feedback is not int (poling)
    this.polling.stop();
  }

  /**
   * Poll once immediately. And restart current poll if it was specified.
   * Data address and length you have to specify in poll prop.
   * It rejects promise on error
   */
  async pollOnce(): Promise<void> {
    if (this.props.int || !this.isFeedbackStarted()) {
      await this.doPoll();
    }
    else {
      // restart polling - it will make a new request and restart interval
      // TODO: review indexStr
      // TODO: review restart - он вообще ожидает выполнения ????
      // TODO: не ждет завершения
      // TODO: нужно ждать ближайшего результата !!!!

      await this.polling.restart();

      // TODO: это не нужно так как должен ожидаться restart();
      await new Promise((resolve, reject) => {
        // TODO: add timeout

        this.polling.addListener((err: Error | undefined, result: any) => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });
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


  private doPoll = async (): Promise<void> => {
    if (!this.requestDataCb) return;

    const result: Uint8Array = await this.requestDataCb();

    // TODO: была ОШИБКА!!! почему решает что данные одинаковые ????
    //  наверное потомучто раньше они уже установились

    // do nothing if it isn't polling data address or data is equal to previous data
    if (isEqualUint8Array(this.pollLastData, result)) return;
    // save data
    this.pollLastData = result;
    // finally rise an event
    this.pollEvents.emit(result);
  }

}


export default class Factory extends DriverFactoryBase<SemiDuplexFeedback, Props> {
  protected SubDriverClass = SemiDuplexFeedback;
  protected instanceId = (props: Props): string => {
    return props.feedbackId || makeUniqId();
  }
}
