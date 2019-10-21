import DebounceBase, {DebounceCb, DebounceItem, ItemPosition} from './DebounceBase';


/**
 * Call only the LAST callback of specified id.
 * Each call of "invoke" will increase the timer.
 *
 * Call invoke method on each change. Only the last time will be fulfilled.
 * It returns a promise which will be fulfilled at the end of full cycle.
 */
export default class DebounceCallIncreasing extends DebounceBase {
  protected updateItem(item: DebounceItem, id: string | number, cb: DebounceCb, debounce?: number) {
    // update cb
    item[ItemPosition.lastCbToCall] = cb;
    // clear previous timeout
    clearTimeout(item[ItemPosition.timeoutId]);
    // make a new timeout
    item[ItemPosition.timeoutId] = setTimeout(() => this.callCb(id), debounce || 0);
  }

}
