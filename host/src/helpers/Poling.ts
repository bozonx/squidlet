import * as EventEmitter from 'eventemitter3';


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
  start(
    methodWhichWillPoll: (...args: any[]) => Promise<any>,
    // in ms
    pollInterval: number,
    uniqId: string | undefined,
  ): void {
    if (this.isInProgress(uniqId)) {
      throw new Error(`Poling of "${uniqId}" and interval ${pollInterval}: This poll already is in progress`);
    }

    const id = this.resolveId(uniqId);
    const polingCbWrapper = () => {
      methodWhichWillPoll()
        .then((result) => this.events.emit(id, null, result))
        .catch((err) => this.events.emit(id, err));
    };

    // start first time immediately
    polingCbWrapper();

    this.intervals[id] = setInterval(polingCbWrapper, pollInterval) as any;
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

  restart(uniqId: string | undefined) {
    // TODO: stop and start again
    // TODO: test
  }

  stop(uniqId: string | undefined) {
    const id = this.resolveId(uniqId);

    clearInterval(this.intervals[id] as any);
    delete this.intervals[id];
  }

  private resolveId(uniqId: string | undefined): string {
    return uniqId || DEFAULT_ID;
  }

}
