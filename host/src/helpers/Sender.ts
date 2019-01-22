class SenderRequest {
  readonly promise: Promise<any>;
  private readonly id: string;
  private readonly timeoutMs: number;
  private readonly resendTimeoutMs: number;
  private startedTimeStamp: number = 0;
  private readonly sendCb: (...p: any[]) => any;
  private sendParams: any[] = [];
  private resolve: (data: any) => void = () => {};
  private reject: (err: Error) => void = () => {};


  constructor(
    id: string,
    timeoutSec: number,
    resendTimeoutSec: number,
    sendCb: (...p: any[]) => any,
    sendParams: any[],
  ) {
    this.id = id;
    this.timeoutMs = timeoutSec * 1000;
    this.resendTimeoutMs = resendTimeoutSec * 1000;
    this.sendCb = sendCb;
    this.sendParams = sendParams;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  updateParams(sendParams: any[]) {
    this.sendParams = sendParams;
  }

  start() {
    if (this.startedTimeStamp) return;

    this.startedTimeStamp = new Date().getTime();

    this.trySend();
  }


  private trySend() {
    if (!this.sendCb) return this.onReject(new Error(`sendCb wasn't set`));

    this.sendCb()
      .then(this.success)
      .catch((err: Error) => {
        if (new Date().getTime() >= this.startedTimeStamp + this.timeoutMs) {
          delete this.sendCb;
          // stop trying and call reject
          this.onReject(err);

          return;
        }

        setTimeout(() => {

          // TODO: print in debug
          console.log(`resending - ${this.id}`);

          // try another one
          this.trySend();
        }, this.resendTimeoutMs);
      });
  }

  private success = (data: any) => {
    delete this.sendCb;
    this.onResolve(data);
  }

}

export default class Sender {
  private readonly timeoutSec: number;
  private readonly resendTimeoutSec: number;
  private readonly requests: {[index: string]: SenderRequest} = {};


  constructor(timeoutSec: number, resendTimeoutSec: number) {
    this.timeoutSec = timeoutSec;
    this.resendTimeoutSec = resendTimeoutSec;
  }


  async send<T>(id: string, sendCb: (...p: any[]) => Promise<T>, ...params: any[]): Promise<T> {
    if (!this.requests[id]) {
      // make new request
      this.requests[id] = new SenderRequest(
        id,
        this.timeoutSec,
        this.resendTimeoutSec,
        sendCb,
        params,
      );

      this.requests[id].start();
    }
    else {
      // update callback params
      this.requests[id].updateParams(params);
    }

    // TODO: может не позволять чтобы cb отличался ??? тогда id и не нужен по идее

    try {
      const result: T = await this.requests[id].promise;
      // TODO: print in debug
      console.log(`Request successfully finished ${id}`);

      delete this.requests[id];

      return result;
    }
    catch (err) {
      delete this.requests[id];

      throw err;
    }

  }

}
