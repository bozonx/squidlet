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
 * Timer sets up on the first call and the next calls don't increase it!
 */
export default class DebounceCall {
  // items by id
  private items: {[index: string]: DebounceItem} = {};


  isInvoking(id: string | number = DEFAULT_ID): boolean {
    return Boolean(this.items[id]);
  }

  async invoke(
    cb: DebounceCb,
    debounce: number | undefined,
    id: string | number = DEFAULT_ID,
  ): Promise<void> {
    // if there isn't debounce time - call immediately
    if (!debounce) {
      if (typeof this.items[id] !== 'undefined') this.clear(id);

      return cb();
    }

    if (!this.items[id]) this.items[id] = [
      cb,
      new Promised<void>(),
      undefined
    ];

    clearTimeout(this.items[id][ItemPosition.timeoutId]);

    this.items[id][ItemPosition.timeoutId] = setTimeout(() => this.callCb(id), debounce);

    return this.items[id][ItemPosition.promiseForWholeDebounce].promise;
  }

  clear(id: string | number) {
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


  private callCb(id: string | number) {
    if (!this.items[id]) {
      this.clear(id);

      return;
    }

    try {
      this.items[id][ItemPosition.lastCbToCall]();
    }
    catch (err) {
      return this.endOfDebounce(id, err);
    }

    this.endOfDebounce(id);
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
