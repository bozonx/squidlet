import Promised from './Promised';


const DEFAULT_ID = 'default';

enum ItemPosition {
  lastCbToCall,
  promiseForWholeDebounce,
  timeoutId
}
type DebounceCb = (...args: any[]) => void;
// Array like [ lastCbToCall, promiseForWholeDebounce, timeoutId ]
type DebounceItem = [DebounceCb, Promised<void>, any];


/**
 * Call only the LAST callback of specified id.
 * Each call of "invoke" will increase the timer.
 */
export default class DebounceCallIncreasing {
  // items by id
  private items: {[index: string]: DebounceItem} = {};


  isInvoking(id: string | number = DEFAULT_ID): boolean {
    return Boolean(this.items[id]);
  }

  /**
   * Call this method on each change.
   * Only the last time will be fulfilled.
   * It returns a promise which will be fulfilled at the end of full cycle.
   */
  invoke(
    cb: DebounceCb,
    debounce: number | undefined,
    id: string | number = DEFAULT_ID,
  ): Promise<void> {
    // if there isn't debounce time - call immediately
    if (!debounce) return this.callCbImmediately(id, cb);

    if (this.items[id]) {
      // update cb
      this.items[id][ItemPosition.lastCbToCall] = cb;
      // clear previous timeout
      clearTimeout(this.items[id][ItemPosition.timeoutId]);
    }
    else {
      // make a new item
      this.items[id] = [ cb, new Promised<void>(), undefined ];
    }

    // make a new timeout
    this.items[id][ItemPosition.timeoutId] = setTimeout(() => this.callCb(id), debounce);
    // return promise of item
    return this.items[id][ItemPosition.promiseForWholeDebounce].promise;
  }

  clear(id: string | number) {
    if (!this.items[id]) return;

    clearTimeout(this.items[id][ItemPosition.timeoutId]);
    this.items[id][ItemPosition.promiseForWholeDebounce].destroy();

    delete this.items[id];
  }

  destroy() {
    for (let id of Object.keys(this.items)) {
      this.clear(id);

      delete this.items[id];
    }
  }


  /**
   * It will be called when the last timeout will be exceeded
   */
  private callCb(id: string | number) {
    if (!this.items[id]) {
      this.clear(id);

      return;
    }

    try {
      // call cb
      this.items[id][ItemPosition.lastCbToCall]();
    }
    catch (err) {
      return this.endOfDebounce(id, err);
    }

    this.endOfDebounce(id);
  }

  private async callCbImmediately(id: string | number, cb: DebounceCb) {
    if (typeof this.items[id] !== 'undefined') this.clear(id);

    cb();
  }

  private endOfDebounce(id: string | number, err?: Error) {
    clearTimeout(this.items[id][ItemPosition.timeoutId]);

    const promised = this.items[id][ItemPosition.promiseForWholeDebounce];

    delete this.items[id];

    if (err) {
      promised.reject(err);
    }
    else {
      promised.resolve();
    }

    promised.destroy();
  }

}
