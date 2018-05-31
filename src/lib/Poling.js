const _ = require('lodash');
const EventEmitter = require('events');


module.exports = class Poling {
  constructor(log) {
    this.log = log;
    this._pollIntervalTimer = null;
    this._events = new EventEmitter();
    this._eventName = `poll`;
  }

  isPollInProgress() {
    return !_.isNil(this._pollIntervalTimer);
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
        .then((result) => this._events.emit(this._eventName, null, result))
        .catch((err) => this._events.emit(this._eventName, err));
    };

    // start first time immediately
    polingCbWrapper();

    this._pollIntervalTimer = setInterval(polingCbWrapper, pollInterval);
  }

  addPolingListener(handler) {
    // add event listener on status change
    this._events.on(this._eventName, handler);
  }

  off(handler) {
    this._events.removeListener(this._eventName, handler);
  }

  stopPoling() {
    clearInterval(this._pollIntervalTimer);
    this._pollIntervalTimer = null;
    this._methodWhichWillPoll = null;
  }

};
