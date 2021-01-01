import Promised from '../Promised';
import {DebounceCb, DebounceItem, ItemPosition} from './DebounceCall';


export const DEFAULT_ID = 'default';


/**
 * Call only the first callback of specified id and refuse other calls while timeout is in progress.
 * If cb was called with error the timeout will be started any way.
 * If debounceMs isn't set then current timeout will be cleared
 */
export default class ThrottleCall {
  // items by id
  protected items: {[index: string]: DebounceItem} = {};


  isInvoking(id: string | number = DEFAULT_ID): boolean {
    return Boolean(this.items[id]);
  }

  invoke(
    cb: DebounceCb,
    debounceMs: number | undefined,
    id: string | number = DEFAULT_ID,
  ): Promise<void> {
    // if there isn't debounce time - call immediately without any timeout
    if (!debounceMs) {
      return this.callCbImmediately(id, cb);
    }

    if (!this.items[id]) {
      const timeout = setTimeout(() => this.endOfTimeout(id), debounceMs);
      // make a new item
      this.items[id] = [ cb, new Promised<void>(), timeout ];

      try {
        cb();
      }
      catch (e) {
        // do nothing if cb ends with error - just wait debounce
      }
    }

    // return promise if item exist or not
    return this.items[id][ItemPosition.promiseForWholeDebounce].promise;
  }

  clear(id: string | number) {
    if (!this.items[id]) return;

    if (this.items[id][ItemPosition.timeout]) clearTimeout(this.items[id][ItemPosition.timeout]);

    this.items[id][ItemPosition.promiseForWholeDebounce].resolve();

    delete this.items[id];
  }

  clearAll() {
    for (let id of Object.keys(this.items)) {
      this.clear(id);
    }
  }

  destroy() {
    for (let id of Object.keys(this.items)) {
      if (this.items[id][ItemPosition.timeout]) clearTimeout(this.items[id][ItemPosition.timeout]);

      this.items[id][ItemPosition.promiseForWholeDebounce].destroy();

      delete this.items[id];
    }
  }


  private endOfTimeout(id: string | number) {
    if (this.items[id][ItemPosition.timeout]) clearTimeout(this.items[id][ItemPosition.timeout]);

    const promised = this.items[id][ItemPosition.promiseForWholeDebounce];

    delete this.items[id];

    promised.resolve();
    promised.destroy();
  }

  private async callCbImmediately(id: string | number, cb: DebounceCb) {
    if (typeof this.items[id] !== 'undefined') this.clear(id);

    cb();
  }

}
