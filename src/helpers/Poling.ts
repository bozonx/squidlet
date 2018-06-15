import * as _ from 'lodash';
import * as EventEmitter from 'events';

import Logger from '../app/interfaces/Logger';

const NO_INTERVAL = -1;

module.exports = class Poling {
  private readonly log: Logger;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'poll';
  private pollIntervalTimerId: number = NO_INTERVAL;

  constructor(log: Logger) {
    this.log = log;
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
  startPoling(methodWhichWillPoll, pollInterval) {
    if (this.isPollInProgress()) {
      this.log.warn(`Poling.startPoling(func, ${pollInterval}): This poll already is in progress`);

      return;
    }

    const polingCbWrapper = () => {
      methodWhichWillPoll()
        .then((result) => this._events.emit(this.eventName, null, result))
        .catch((err) => this._events.emit(this.eventName, err));
    };

    // start first time immediately
    polingCbWrapper();

    this.pollIntervalTimerId = setInterval(polingCbWrapper, pollInterval);
  }

  addPolingListener(handler) {
    // add event listener on status change
    this._events.on(this.eventName, handler);
  }

  off(handler) {
    this._events.removeListener(this.eventName, handler);
  }

  stopPoling() {
    clearInterval(this.pollIntervalTimerId);
    this.pollIntervalTimerId = NO_INTERVAL;
    this._methodWhichWillPoll = null;
  }

};
