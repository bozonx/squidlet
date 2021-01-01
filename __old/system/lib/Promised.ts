export default class Promised<T = any> {
  get promise(): Promise<T> {
    return this._promise;
  }

  private _promise: Promise<T>;
  private promiseResolve?: (result?: T) => void;
  private promiseReject?: (err: Error) => void;
  private resolved: boolean = false;
  private rejected: boolean = false;
  private canceled: boolean = false;


  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this.promiseResolve = resolve;
      this.promiseReject = reject;
    });
  }

  destroy() {
    delete this.promiseResolve;
    delete this.promiseReject;
    delete this._promise;
  }


  resolve = (result?: T) => {
    if (this.canceled) return;

    if (this.promiseResolve) this.promiseResolve(result);

    this.resolved = true;

    delete this.promiseResolve;
    delete this.promiseReject;
  }

  reject = (err: Error) => {
    if (this.canceled) return;

    if (this.promiseReject) this.promiseReject(err);

    this.rejected = true;

    delete this.promiseResolve;
    delete this.promiseReject;
  }

  /**
   * After cancel promise won't be able to be fulfilled.
   * If promise was fulfilled it can't be cancelled.
   */
  cancel() {
    if (this.isFulfilled()) return;

    this.canceled = true;

    delete this.promiseResolve;
    delete this.promiseReject;
  }

  isResolved(): boolean {
    return this.resolved;
  }

  isRejected(): boolean {
    return this.rejected;
  }

  isCanceled(): boolean {
    return this.canceled;
  }

  isFulfilled(): boolean {
    return this.resolved || this.rejected;
  }

}
