import IndexedEventEmitter from './IndexedEventEmitter';


const DEFAULT_ID = 'defaultUniqId';
enum CURRENT_POLL_ENUM {
  intervalId,
  methodWhichPoll,
  methodWrapper,
  pollInterval,
}

type PollHandler = (err: Error, result: any) => void;
type MethodWhichPoll = () => Promise<any>;
type MethodWrapper = () => void;
// [ intervalId, methodWhichPoll, MethodWrapper, pollInterval ]
type CurrentPoll = [any, MethodWhichPoll, MethodWrapper, number];


// TODO: проверить что не будут выполняться другие poll пока выполняется текущий (если завис)
// TODO: можно перерефакторить чтобы был отдельный класс poll без указания id - всегда 1 methodWhichPoll


export default class Polling {
  private readonly events = new IndexedEventEmitter<PollHandler>();
  //private pollIntervalTimerId: number = NO_INTERVAL;
  private readonly currentPolls: {[index: string]: CurrentPoll} = {};

  constructor() {
  }

  isInProgress(uniqId: string | undefined): boolean {
    const id = this.resolveId(uniqId);

    return typeof this.currentPolls[id] !== 'undefined';
  }

  /**
   * Start polling.
   * This method calls only once on one id.
   */
  start(
    methodWhichWillPoll: MethodWhichPoll,
    // in ms
    pollInterval: number,
    uniqId: string | undefined,
  ): void {
    if (this.isInProgress(uniqId)) {
      throw new Error(`Polling of "${uniqId}" and interval ${pollInterval}: This poll already is in progress`);
    }

    const id = this.resolveId(uniqId);
    const pollingCbWrapper: MethodWrapper = () => {
      methodWhichWillPoll()
        .then((result) => this.events.emit(id, null, result))
        .catch((err) => this.events.emit(id, err));
    };

    // start first time immediately
    pollingCbWrapper();

    // create timer
    const intervalId = setInterval(pollingCbWrapper, pollInterval);

    // save  poll params
    this.currentPolls[id] = [intervalId, methodWhichWillPoll, pollingCbWrapper, pollInterval];
  }

  addListener(handler: PollHandler, uniqId?: string): number {
    const id = this.resolveId(uniqId);

    // add event listener on status change
    return this.events.addListener(id, handler);
  }

  removeListener(handlerIndex: number, uniqId?: string) {
    const id = this.resolveId(uniqId);

    this.events.removeListener(id, handlerIndex);
  }

  /**
   * Restart polling and return data of first poll
   */
  async restart(uniqId?: string): Promise<any> {
    const id = this.resolveId(uniqId);

    if (!this.currentPolls[id]) {
      throw new Error(`Can't restart polling of "${uniqId}" because it hasn't been started yet`);
    }

    let result: any;

    // clear interval
    clearInterval(this.currentPolls[id][CURRENT_POLL_ENUM.intervalId]);

    // make first poll
    //this.currentPolls[id][CURRENT_POLL_ENUM.methodWrapper]();

    try {
      result = await this.currentPolls[id][CURRENT_POLL_ENUM.methodWrapper]();
    }
    catch(err) {
      // start polling any way
      this.renewInterval(id);

      throw err;
    }

    // start interval
    this.renewInterval(id);

    return result;
  }

  stop(uniqId?: string) {
    const id = this.resolveId(uniqId);

    if (typeof this.currentPolls[id] !== 'undefined') {
      clearInterval(this.currentPolls[id][CURRENT_POLL_ENUM.intervalId]);
    }

    delete this.currentPolls[id];
  }

  private resolveId(uniqId: string | undefined): string {
    return uniqId || DEFAULT_ID;
  }

  private renewInterval(id: string) {
    this.currentPolls[id][CURRENT_POLL_ENUM.intervalId] = setInterval(
      this.currentPolls[id][CURRENT_POLL_ENUM.methodWrapper],
      this.currentPolls[id][CURRENT_POLL_ENUM.pollInterval]
    );
  }

}
