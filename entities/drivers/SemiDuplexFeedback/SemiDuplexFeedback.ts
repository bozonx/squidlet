import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import Polling from 'system/lib/Polling';
import Sender from 'system/lib/Sender';
import {Handler, PollProps} from 'system/lib/base/MasterSlaveBaseNodeDriver';

import {ImpulseInput, ImpulseInputProps} from '../ImpulseInput/ImpulseInput';


export interface Props {
  feedbackId: string;
  // if you have one interrupt pin you can specify in there
  int?: ImpulseInputProps;
  //int?: {[index: string]: any};
  // Poll interval in ms.
  pollIntervalMs: number;
}


// TODO: review int


/**
 * It will start polling of listening of interruption.
 * At each poll action the specified callback will be used.
 * To use interruption set up "int" props.
 * To use polling don't defined "int" props.
 */
export class SemiDuplexFeedback extends DriverBase<Props> {
  private impulseInput?: ImpulseInput;
  private impulseHandlerIndex?: number;

  protected readonly pollEvents = new IndexedEvents<Handler>();
  protected readonly polling: Polling = new Polling();
  protected sender!: Sender;

  // last received data by polling by function number.
  // it needs to decide to rise change event or not
  //private pollLastData: Uint8Array[] = [];


  init = async () => {
    this.sender = new Sender(
      this.context.config.config.requestTimeoutSec,
      this.context.config.config.senderResendTimeout,
      this.context.log.debug,
      this.context.log.warn
    );

    if (this.props.int) {
      this.impulseInput = await this.context.getSubDriver<ImpulseInput>(
        'ImpulseInput',
        this.props.int || {}
      );
    }
  }

  destroy = async () => {
    this.pollEvents.destroy();
    this.polling.destroy();
    this.sender.destroy();
  }


  startFeedback(): void {
    if (this.props.int) {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.startFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseHandlerIndex = this.impulseInput.onChange(this.pollAllFunctions);

      return;
    }
    // start polling if feedback is not int
    this.polling.start(this.doPoll, this.props.pollIntervalMs);
  }

  stopFeedBack() {
    if (this.props.int) {
      if (!this.impulseHandlerIndex) return;

      this.impulseInput && this.impulseInput.removeListener(this.impulseHandlerIndex);

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
   * Listen to data which received by polling or interruption.
   */
  addListener(handler: Handler): number {
    return this.pollEvents.addListener(handler);
  }

  removeListener(handlerIndex: number): void {
    this.pollEvents.removeListener(handlerIndex);
  }


  // TODO: remove
  /**
   * Poll all the defined polling to data addresses by turns and don't stop on errors.
   */
  private pollAllFunctions = async () => {
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

  private doPoll = async (): Promise<void> => {
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

  private handleIncomeData(incomeData: Uint8Array, pollIndex: number) {


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


  // private makeSenderId(functionHex: number | undefined, method: string, ...params: (string | number)[]) {
  //   const resolvedDataAddr: string = this.functionHexToStr(functionHex);
  //
  //   // TODO: bus num and address не нужно так как инстанс драйвера привязан к конкретному bus и address
  //   //       any way see Sender
  //   const busNum = (typeof this.props.busNum === 'undefined') ? -1 : this.props.busNum;
  //
  //   return [busNum, this.props.address, resolvedDataAddr, method, ...params].join();
  // }


}


export default class Factory extends DriverFactoryBase<SemiDuplexFeedback, Props> {
  protected SubDriverClass = SemiDuplexFeedback;
  protected instanceId = (props: Props): string => {
    // TODO: если нет id то наверное создавать новый всегда
    return props.feedbackId;
  }
}
