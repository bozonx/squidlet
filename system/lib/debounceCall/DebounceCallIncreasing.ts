import DebounceCall, {DebounceCb, DebounceItem, ItemPosition} from './DebounceCall';


/**
 * Call only the LAST callback of specified id.
 * Each call of "invoke" will increase the timer.
 *
 * Call invoke method on each change. Only the last time will be fulfilled.
 * It returns a promise which will be fulfilled at the end of full cycle.
 */
export default class DebounceCallIncreasing extends DebounceCall {
  protected updateItem(item: DebounceItem, id: string | number, cb: DebounceCb, debounceMs?: number) {
    // update cb
    item[ItemPosition.lastCbToCall] = cb;
    // clear previous timeout
    if (item[ItemPosition.timeout]) clearTimeout(item[ItemPosition.timeout]);
    // make a new timeout
    item[ItemPosition.timeout] = setTimeout(() => this.callCb(id), debounceMs || 0);
  }

}
