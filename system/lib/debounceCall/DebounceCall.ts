type Timeout = NodeJS.Timeout;

import Promised from '../Promised';


export const DEFAULT_ID = 'default';

export enum ItemPosition {
  lastCbToCall,
  promiseForWholeDebounce,
  timeout
}
export type DebounceCb = (...args: any[]) => void;
// Array like [ lastCbToCall, promiseForWholeDebounce, Timeout ]
export type DebounceItem = [DebounceCb, Promised<void>, Timeout];

/**
 * Call only the LAST callback of specified id.
 * Timer sets up on the first call and the next calls don't increase it!
 */
export default class DebounceCall {
  // items by id
  protected items: {[index: string]: DebounceItem} = {};

  // TODO: test
  get isDestroyed(): boolean {
    return typeof this.items === 'undefined';
  }

  isInvoking(id: string | number = DEFAULT_ID): boolean {
    return Boolean(this.items[id]);
  }

  /**
   * Try to invoke a cb.
   * It returns promise that will be resolved when time is up.
   * But it won't wait for cb's promise!
   */
  invoke(
    cb: DebounceCb,
    debounceMs: number | undefined,
    id: string | number = DEFAULT_ID,
  ): Promise<void> {
    // if there isn't debounce time - call immediately
    if (!debounceMs || debounceMs < 0) return this.callCbImmediately(id, cb);

    // it there is debounce in progress then just update cb
    if (this.items[id]) {
      this.updateItem(this.items[id], id, cb, debounceMs);
    }
    // else if it is the first time
    else {
      const timeout = setTimeout(() => this.callCb(id), debounceMs);
      // make a new item
      this.items[id] = [ cb, new Promised<void>(), timeout ];
    }

    // return promise of item
    return this.items[id][ItemPosition.promiseForWholeDebounce].promise;
  }

  clear(id: string | number = DEFAULT_ID) {
    if (!this.items[id]) return;

    if (this.items[id][ItemPosition.timeout]) clearTimeout(this.items[id][ItemPosition.timeout]);
    // TODO: может лучше зарезолвить промис. Но при дестрое дестроить
    this.items[id][ItemPosition.promiseForWholeDebounce].destroy();

    delete this.items[id];
  }

  clearAll() {
    for (let id of Object.keys(this.items)) {
      this.clear(id);
    }
  }

  destroy() {
    for (let id of Object.keys(this.items)) {
      this.clear(id);
    }

    // TODO: test
    delete this.items;
  }


  protected updateItem(
    item: DebounceItem,
    id: string | number,
    cb: DebounceCb,
    debounceMs?: number
  ) {
    // update cb
    item[ItemPosition.lastCbToCall] = cb;
  }

  /**
   * It will be called when the last timeout will be exceeded
   */
  protected callCb(id: string | number) {
    if (!this.items[id]) return;

    try {
      // just call cb and don't handle the result and don't wait for promise
      this.items[id][ItemPosition.lastCbToCall]();
    }
    catch (err) {
      return this.endOfDebounce(err, id);
    }

    this.endOfDebounce(undefined, id);
  }

  protected endOfDebounce(err: Error | undefined, id: string | number) {
    if (this.items[id][ItemPosition.timeout]) clearTimeout(this.items[id][ItemPosition.timeout]);

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

  protected async callCbImmediately(id: string | number, cb: DebounceCb) {
    if (typeof this.items[id] !== 'undefined') this.clear(id);

    cb();
  }

}
