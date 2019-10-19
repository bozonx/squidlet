
// TODO: review - see DebounceCallIncreasing

/**
 * Call only the LAST callback of specified id.
 * Timer sets up on the first call and the next calls don't increase it!
 */
export default class DebounceCall {
  private debounceTimeouts: {[index: string]: any} = {};
  private lastCb?: (...args: any[]) => void;


  invoke(id: string | number, debounce: number | undefined, cb: (...args: any[]) => void, ...args: any[]) {
    // if there isn't debounce - call immediately
    if (!debounce) {
      if (typeof this.debounceTimeouts[id] !== 'undefined') this.clear(id);

      return cb(...args);
    }

    this.lastCb = cb;

    // if debounce is in progress - do nothing
    if (typeof this.debounceTimeouts[id] !== 'undefined') return;

    // making new debounce timeout
    const wrapper = () => {
      if (this.lastCb) this.lastCb(...args);
      delete this.debounceTimeouts[id];
      delete this.lastCb;
    };

    this.debounceTimeouts[id] = setTimeout(wrapper, debounce);
  }

  clear(id: string | number) {
    clearTimeout(this.debounceTimeouts[id]);
    delete this.debounceTimeouts[id];
    delete this.lastCb;
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
