import * as EventEmitter from 'events';


const DEFAULT_ID = 'defaultUniqId';


export default class Poling {
  //private readonly log: Logger;
  private readonly events: EventEmitter = new EventEmitter();
  //private pollIntervalTimerId: number = NO_INTERVAL;
  private readonly intervals: {[index: string]: number} = {};

  constructor() {
  }

  isInProgress(uniqId: string | undefined): boolean {
    const id = this.resolveId(uniqId);

    return typeof this.intervals[id] !== 'undefined';
  }

  /**
   * Start poling.
   * This method calls only once on one id.
   */
  startPoling(
    methodWhichWillPoll: (...args: any[]) => Promise<any>,
    // in ms
    pollInterval: number,
    uniqId: string | undefined,
  ): void {
    if (this.isInProgress(uniqId)) {
      throw new Error(`Poling of "${uniqId}" and interval ${pollInterval}: This poll already is in progress`);
    }

    const id = this.resolveId(uniqId);
    const polingCbWrapper: Function = () => {
      methodWhichWillPoll()
        .then((result) => this.events.emit(id, null, result))
        .catch((err) => this.events.emit(id, err));
    };

    // start first time immediately
    polingCbWrapper();

    this.intervals[id] = setInterval(polingCbWrapper, pollInterval);
  }

  addListener(handler: (err: Error, result: any) => void, uniqId: string | undefined) {
    const id = this.resolveId(uniqId);

    // add event listener on status change
    this.events.addListener(id, handler);
  }

  removeListener(handler: (err: Error, result: any) => void, uniqId: string | undefined) {
    const id = this.resolveId(uniqId);

    this.events.removeListener(id, handler);
  }

  stopPoling(uniqId: string | undefined) {
    const id = this.resolveId(uniqId);

    clearInterval(this.intervals[id]);
    delete this.intervals[id];
  }

  private resolveId(uniqId: string | undefined): string {
    return uniqId || DEFAULT_ID;
  }

}
