import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';

import readLogic from './readLogic';
import parseIncomeMessage, {MESSAGE_POSITIONS} from './parseIncomeMessage';


export default class PollOnceLogic {
  private functionsEvents = new IndexedEventEmitter();


  constructor() {
  }


  addEventListener(functionNumber: number, cb: (args: any[]) => void): number {
    return this.functionsEvents.addListener(functionNumber, cb);
  }

  removeListener(handlerIndex: number) {
    this.functionsEvents.removeListener(handlerIndex);
  }

  async pollOnce(): Promise<void> {
    const [messages, nextPackageLength] = await readLogic(this.askDataCb);

    if (nextPackageLength) {
      // TODO: make a new poll
    }

    const functionsData: [number, any[]][] = parseIncomeMessage(messages);

    for (let item of functionsData) {
      this.functionsEvents.emit(
        item[MESSAGE_POSITIONS.functionNum],
        item[MESSAGE_POSITIONS.functionsArgs]
      );
    }
  }


  private askDataCb = async (register: number, count: number): Promise<Uint8Array> => {
    // TODO: make a new poll
  }

}
