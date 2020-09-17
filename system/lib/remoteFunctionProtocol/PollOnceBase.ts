import IndexedEvents from 'system/lib/IndexedEvents';

import {MESSAGE_POSITIONS} from './constants';
import readLogic from './readLogic';


export type FunctionHandler = (channel: number, payload: Uint8Array) => void;


export default abstract class PollOnceBase {
  private readonly logWarn: (msg: string) => void;
  private functionsEvents = new IndexedEvents<FunctionHandler>();


  constructor(logWarn: (msg: string) => void) {
    this.logWarn = logWarn;
  }


  protected abstract readLength(): Promise<number>;
  protected abstract readPackage(length: number): Promise<Uint8Array>;


  addEventListener(cb: FunctionHandler): number {
    return this.functionsEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.functionsEvents.removeListener(handlerIndex);
  }

  async pollOnce(): Promise<void> {
    return await readLogic(this.readLength, this.readPackage, this.handleIncomePacket);
  }


  private handleIncomePacket = (messages: Uint8Array[]) => {
    // emit all the income messages
    for (let item of messages) {
      const funcNum: number = item[MESSAGE_POSITIONS.functionNum];
      // TODO: test
      const returnData: Uint8Array = item.slice(MESSAGE_POSITIONS.functionsArgs);

      this.functionsEvents.emit(funcNum, returnData);
    }
  }

}
