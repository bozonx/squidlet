import IndexedEvents from 'system/lib/IndexedEvents';

import readLogic, {AskDataCb} from './readLogic';
import {MESSAGE_POSITIONS} from './constants';


export type FunctionHandler = (funcNum: number, returnData: Uint8Array) => void;


export default class PollOnceLogic {
  private readonly askDataCb: AskDataCb;
  private readonly logWarn: (msg: string) => void;
  private functionsEvents = new IndexedEvents<FunctionHandler>();


  constructor(
    askDataCb: AskDataCb,
    logWarn: (msg: string) => void,
  ) {
    this.askDataCb = askDataCb;
    this.logWarn = logWarn;
  }


  addEventListener(cb: FunctionHandler): number {
    return this.functionsEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.functionsEvents.removeListener(handlerIndex);
  }

  async pollOnce(): Promise<void> {
    return await readLogic(this.askDataCb, this.handleIncomePacket);
  }


  private handleIncomePacket(messages: Uint8Array[]) {
    // emit all the income messages
    for (let item of messages) {
      const funcNum: number = item[MESSAGE_POSITIONS.functionNum];
      // TODO: test
      const returnData: Uint8Array = item.slice(MESSAGE_POSITIONS.functionsArgs);

      this.functionsEvents.emit(funcNum, returnData);
    }
  }

}
