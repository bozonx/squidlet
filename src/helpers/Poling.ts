import * as EventEmitter from 'events';


const NO_INTERVAL = -1;


module.exports = class Poling {
  //private readonly log: Logger;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'poll';
  private pollIntervalTimerId: number = NO_INTERVAL;

  constructor() {
  }

  isPollInProgress(): boolean {
    return this.pollIntervalTimerId > NO_INTERVAL;
  }

  /**
   * Start poling.
   * This method calls only once.
   * @param {function} methodWhichWillPoll - it has to return a promise
   * @param {number} pollInterval - in ms
   */
  startPoling(methodWhichWillPoll: (...args: any[]) => Promise<any>, pollInterval: number): void {
    if (this.isPollInProgress()) {
      throw new Error(`Poling.startPoling(func, ${pollInterval}): This poll already is in progress`);
    }

    const polingCbWrapper: Function = () => {
      methodWhichWillPoll()
        .then((result) => this.events.emit(this.eventName, null, result))
        .catch((err) => this.events.emit(this.eventName, err));
    };

    // start first time immediately
    polingCbWrapper();

    this.pollIntervalTimerId = setInterval(polingCbWrapper, pollInterval);
  }

  addPolingListener(handler: (err: Error, result: any) => void) {
    // add event listener on status change
    this.events.addListener(this.eventName, handler);
  }

  off(handler: (err: Error, result: any) => void) {
    this.events.removeListener(this.eventName, handler);
  }

  stopPoling() {
    clearInterval(this.pollIntervalTimerId);
    this.pollIntervalTimerId = NO_INTERVAL;
  }

};
