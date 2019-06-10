export default class Promised<T = any> {
  readonly promise: Promise<T>;

  private promiseResolve?: (result: T) => void;
  private promiseReject?: (err: Error) => void;
  private resolved: boolean = false;
  private rejected: boolean = false;


  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.promiseResolve = resolve;
      this.promiseReject = reject;
    });
  }


  resolve(result: T) {
    if (this.promiseResolve) this.promiseResolve(result);

    this.resolved = true;
  }

  reject(err: Error) {
    if (this.promiseReject) this.promiseReject(err);

    this.rejected = true;
  }

  isResolved(): boolean {
    return this.resolved;;
  }

  isRejected(): boolean {
    return this.rejected;
  }

  isFulfiled(): boolean {
    return this.resolved || this.rejected;
  }

}
