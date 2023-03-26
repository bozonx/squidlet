import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import Polling from '../squidlet-lib/src/Polling';
import {isEqualUint8Array} from '../squidlet-lib/src/binaryHelpers';
import Context from 'src/system/Context';

import {ImpulseInput, ImpulseInputProps} from '../../entities/drivers/ImpulseInput/ImpulseInput';


//type Data = Uint8Array | {[index: string]: any};

// undefined means no new data
export type Handler = (data: any | undefined) => void;

export interface SemiDuplexFeedbackBaseProps {
  pollIntervalMs: number;
  interrupt?: ImpulseInputProps;
}
// TODO: review
export interface SemiDuplexFeedbackProps extends SemiDuplexFeedbackBaseProps {
  intDriver?: ImpulseInput;
  read: () => Promise<any | undefined>;
  compareResult: boolean;
}

// TODO: добавить очередь с отменой

/**
 * It will start polling of listening of interruption.
 * At each poll action the specified callback will be used.
 * To use interruption set up "int" props.
 * To use polling don't defined "int" props.
 */
export default class SemiDuplexFeedbackLogic {
  private readonly context: Context;
  private readonly props: SemiDuplexFeedbackProps;

  private impulseInputDriver?: ImpulseInput;
  private impulseHandlerIndex?: number;
  private readonly pollEvents = new IndexedEvents<Handler>();
  private readonly polling: Polling = new Polling();

  // TODO: for long data > 8 byte use hash generating
  // The latest received data by calling requestDataCb.
  // it needs to decide to rise change event or not
  private lastPollResult?: Uint8Array;


  constructor(context: Context, props: SemiDuplexFeedbackProps) {
    this.context = context;
    this.props = props;
  }


  destroy = () => {

    // TODO: review

    this.pollEvents.destroy();
    this.polling.destroy();

    delete this.impulseInputDriver;
  }


  isFeedbackStarted(): boolean {
    if (this.props.int) {
      return typeof this.impulseHandlerIndex !== 'undefined';
    }

    return this.polling.isInProgress();
  }

  startFeedback(): void {

    // TODO: очистить предыдущий feedback если был запущен ???

    if (this.props.interrupt) {
      if (!this.impulseInputDriver) {
        throw new Error(
          `SemiDuplexFeedback.startFeedback. ` +
          `impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseHandlerIndex = this.impulseInputDriver.onChange(() => {

        // TODO: может не делать новые запросы пока текущий в процессе ???

        this.doPoll()
          .catch(this.context.log.error);
      });

      return;
    }
    // start polling if feedback is not int
    this.polling.start(this.doPoll, this.props.pollIntervalMs);
  }

  stopFeedBack() {
    if (this.props.intDriver) {
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
   * It rejects promise on error
   */
  pollOnce = async (): Promise<void> => {
    if (this.props.interrupt || !this.isFeedbackStarted()) {
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

    // TODO: могут быть любые данные, не обязательно Uint8Array

    const result: any | undefined = await this.props.read();

    // TODO: undefined means no new data

    // TODO: была ОШИБКА!!! почему решает что данные одинаковые ????
    //  наверное потомучто раньше они уже установились

    // do nothing if compareResult is on and the result is the same with the previous one
    if (this.props.compareResult && isEqualUint8Array(this.lastPollResult, result)) return;
    // save data
    this.lastPollResult = result;
    // finally rise an event
    this.pollEvents.emit(result);
  }

}
