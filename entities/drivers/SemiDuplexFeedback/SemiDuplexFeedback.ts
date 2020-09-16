import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import Polling from 'system/lib/Polling';
import Sender from 'system/lib/Sender';
import {Handler} from 'system/lib/base/MasterSlaveBaseNodeDriver';

import {ImpulseInput} from '../ImpulseInput/ImpulseInput';


// type of feedback - polling or interruption
//export type FeedbackType = 'poll' | 'int';

// export interface PollPreProps {
//   // data to write before read or function number to read from
//   request?: Uint8Array | string | number;
//   requestCb?: () => Promise<Uint8Array>;
//   // length of result which will be read. If isn't set then `defaultPollIntervalMs` will be used.
//   resultLength?: number;
//   // poll interval if polling is used in ms
//   intervalMs?: number;
// }
//
// export interface PollProps {
//   request?: Uint8Array;
//   requestCb?: () => Promise<Uint8Array>;
//   // string variant of request. Useful for print into messages. It will be generated in constructor
//   requestStr?: string;
//   resultLength?: number;
//   intervalMs?: number;
// }


export interface Props {
  feedbackId: string;
  // if you have one interrupt pin you can specify in there
  //int?: ImpulseInputProps;
  int?: {[index: string]: any};
  // length of result which will be read.
  //resultLength?: number;
  // poll interval if polling is used in ms.
  // If isn't set then `defaultPollIntervalMs` will be used.
  intervalMs?: number;
}


/**
 * It will start polling of listening of interruption.
 * At each poll action the specified callback will be used.
 * To use interruption pin set up "int" props.
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
  private pollLastData: Uint8Array[] = [];


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


  startFeedback(): void {
    if (this.props.feedback === 'int') {
      if (!this.impulseInput) {
        throw new Error(
          `MasterSlaveBaseNodeDriver.startFeedback. impulseInput driver hasn't been set. ${JSON.stringify(this.props)}`
        );
      }

      this.impulseHandlerIndex = this.impulseInput.onChange(this.pollAllFunctions);

      return;
    }

    super.startFeedback();
  }

  stopFeedBack() {
    if (this.props.feedback === 'int') {
      if (!this.impulseHandlerIndex) return;

      this.impulseInput && this.impulseInput.removeListener(this.impulseHandlerIndex);

      return;
    }

    super.stopFeedBack();
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
