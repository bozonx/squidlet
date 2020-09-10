import IndexedEvents from 'system/lib/IndexedEvents';

import readLogic, {AskDataCb} from './readLogic';
import {functionsParsers, Results} from './parseFunctionsArgs';
import {MESSAGE_POSITIONS} from './constants';


export type FunctionHandler = (functionNumber: number, args: Results) => void;


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
    const functionsData: [number, Results][] = this.parseIncomeMessages(messages);
    // emit all the income messages
    for (let item of functionsData) {
      const [functionNumber, args] = item;

      this.functionsEvents.emit(functionNumber, args);
    }
  }

  private parseIncomeMessages(messages: Uint8Array[]): [number, Results][] {
    const result: [number, Results][] = [];

    for (let item of messages) {
      const functionNum: number = item[MESSAGE_POSITIONS.functionNum];
      // TODO: test
      const data: Uint8Array = item.slice(MESSAGE_POSITIONS.functionsArgs);

      if (!functionsParsers[functionNum]) {
        this.logWarn(
          `PollOnceLogic: Can't recognize the function handler: ${functionNum}`
        );

        continue;
      }

      let args: Results;

      try {
        args = functionsParsers[functionNum](data);
      }
      catch (e) {
        this.logWarn(
          `PollOnceLogic: an error occurred while parsing ` +
          `function ${functionNum} result: ${e}`
        );

        continue;
      }

      result.push([functionNum, args]);
    }

    return result;
  }

}
