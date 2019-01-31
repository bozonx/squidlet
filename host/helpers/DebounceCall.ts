
export default class DebounceCall {
  private debounceTimeouts: {[index: string]: any} = {};

  invoke(id: string | number, debounce: number | undefined, cb: (...args: any[]) => void, ...args: any[]) {
    // if there isn't debounce - call immediately
    if (!debounce) return cb(...args);

    // if debounce is in progress - do nothing
    if (typeof this.debounceTimeouts[id] !== 'undefined') return;

    // making new debounce timeout
    const wrapper = () => {
      delete this.debounceTimeouts[id];
      cb(...args);
    };

    this.debounceTimeouts[id] = setTimeout(wrapper, debounce);
  }

}
