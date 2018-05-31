const _ = require('lodash');
const queue = require('queue');
const EventEmitter = require('events');


module.exports = class RequestQueue {
  constructor(log) {
    this.log = log;
    this._queue = queue({ autostart: true, concurrency: 1 });
    // it needs for make callbacks unique
    this._queueCallbacks = {};
    this._events = new EventEmitter();
    this._eventName = `jobEnd`;

    this._queue.timeout = 60000;
    this._queue.on('timeout', (next, job) => {
      const jobId = this._getIdByJob(job);
      const errMsg = `Queue job "${jobId}" timed out`;
      this.log.error(errMsg);

      this._removeUniqId(job);
      // emit error event
      this._events.emit(this._eventName, errMsg, null, jobId);

      next();
    });

    // get notified when jobs complete
    this._queue.on('success', (result, job) => {
      const jobId = this._getIdByJob(job);
      this._removeUniqId(job);
      // emit success event
      this._events.emit(this._eventName, null, result, jobId);
    });

    this._queue.on('error', (err, job) => {
      const jobId = this._getIdByJob(job);
      this._removeUniqId(job);
      // emit error event
      this._events.emit(this._eventName, err, null, jobId);
    });
  }

  isRequestInQueue(uniqId) {
    return !!this._queueCallbacks[uniqId];
  }

  onJobEnd(cb) {
    this._events.on(this._eventName, cb);
  }

  /**
   * add request to queue.
   * @param {string} uniqId
   * @param requestMethod
   * @return {Promise}
   */
  request(uniqId, requestMethod) {
    // if the same request already in the queue - return its promise.
    if (this._queueCallbacks[uniqId]) {
      return Promise.reject({ logLevel: 'warn', msg: `Trying to add the same callback to queue. ${uniqId}` });
    }

    let innerResolve;
    let innerReject;

    const cb = () => {
      return requestMethod()
        .then((...p) => innerResolve(...p))
        .catch((err) => {
          innerReject(err);

          return Promise.reject(err);
        });
    };

    const promise = new Promise((resolve, reject) => {
      innerResolve = resolve;
      innerReject = reject;
      // add callback to queue
      this._queue.push(cb);
    });

    // save uniq id of request
    this._queueCallbacks[uniqId] = {
      cb,
      promise,
    };

    return promise;
  }

  _removeUniqId(job) {
    // remove saved callback
    const jobId = this._getIdByJob(job);
    delete this._queueCallbacks[jobId];
  }

  _getIdByJob(job) {
    let id;

    _.find(this._queueCallbacks, (item, name) => {
      if (item.cb === job) {
        id = name;

        return true;
      }
    });

    return id;
  }

};
