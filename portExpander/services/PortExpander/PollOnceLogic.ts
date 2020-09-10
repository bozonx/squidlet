import IndexedEvents from 'system/lib/IndexedEvents';

import readLogic, {AskDataCb} from './readLogic';
import parseIncomeMessage, {MESSAGE_POSITIONS, Results} from './parseIncomeMessage';


export type FunctionHandler = (functionNumber: number, args: Results) => void;


export default class PollOnceLogic {
  private readonly askDataCb: AskDataCb;
  private functionsEvents = new IndexedEvents<FunctionHandler>();


  constructor(askDataCb: AskDataCb) {
    this.askDataCb = askDataCb;
  }


  addEventListener(cb: FunctionHandler): number {
    return this.functionsEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.functionsEvents.removeListener(handlerIndex);
  }

  async pollOnce(): Promise<void> {
    const [messages, nextPackageLength] = await readLogic(this.askDataCb);

    if (nextPackageLength) {
      // TODO: make a new poll, но обработать текущий и поднять события
    }

    const functionsData: [number, Results][] = parseIncomeMessage(messages);

    for (let item of functionsData) {
      this.functionsEvents.emit(
        item[MESSAGE_POSITIONS.functionNum],
        item[MESSAGE_POSITIONS.functionsArgs]
      );
    }
  }

}
