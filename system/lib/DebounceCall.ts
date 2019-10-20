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

  invoke(cb: (...args: any[]) => void, id: string | number, debounce: number | undefined): Promise<void> {
    // if there isn't debounce time - call immediately
    if (!debounce) return this.callCbImmediately(id, cb);

    // check if item is in progress
    if (this.items[id]) {
      // update cb
      this.items[id][ItemPosition.lastCbToCall] = cb;
    }
    else {
      // make a new item
      this.items[id] = [ cb, new Promised<void>(), undefined ];
    }

    // make a new timeout
    this.items[id][ItemPosition.timeoutId] = setTimeout(() => this.callCb(id), debounce);
    // return promise of item
    return this.items[id][ItemPosition.promiseForWholeDebounce].promise;

    // this.lastCb = cb;
    //
    // // if debounce is in progress - do nothing
    // if (typeof this.debounceTimeouts[id] !== 'undefined') return;
    //
    // // making new debounce timeout
    // const wrapper = () => {
    //   if (this.lastCb) this.lastCb(...args);
    //   delete this.debounceTimeouts[id];
    //   delete this.lastCb;
    // };
    //
    // this.debounceTimeouts[id] = setTimeout(wrapper, debounce);
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


  private async callCbImmediately(id: string | number, cb: DebounceCb) {
    // clear item if it has been started before
    if (typeof this.items[id] !== 'undefined') this.clear(id);

    cb();
  }

}


// !!!! it calls the first one cb and other refuses
// export default class DebounceCall {
//   private debounceTimeouts: {[index: string]: any} = {};
//
//   invoke(id: string | number, debounce: number | undefined, cb: (...args: any[]) => void, ...args: any[]) {
//     // if there isn't debounce - call immediately
//     if (!debounce) {
//       if (typeof this.debounceTimeouts[id] !== 'undefined') this.clear(id);
//
//       return cb(...args);
//     }
//
//     // if debounce is in progress - do nothing
//     if (typeof this.debounceTimeouts[id] !== 'undefined') return;
//
//     // making new debounce timeout
//     const wrapper = () => {
//       delete this.debounceTimeouts[id];
//       cb(...args);
//     };
//
//     this.debounceTimeouts[id] = setTimeout(wrapper, debounce);
//   }
//
//   clear(id: string | number) {
//     clearTimeout(this.debounceTimeouts[id]);
//     delete this.debounceTimeouts[id];
//   }
//
// }
