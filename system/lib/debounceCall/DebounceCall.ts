import Promised from '../Promised';


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
