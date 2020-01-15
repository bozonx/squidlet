import {makeUniqNumber} from './uniqId';


class SenderRequest {
  readonly promise: Promise<any>;
  private readonly id: string;
  private readonly timeoutMs: number;
  private readonly resendTimeoutMs: number;
  private readonly logDebug: (msg: string) => void;
  private startedTimeStamp: number = 0;
  private readonly sendCb: (...p: any[]) => any;
  private sendParams: any[] = [];
  // TODO: use promised
  private resolve: (data: any) => void = () => {};
  private reject: (err: Error) => void = () => {};
  // if cb params was changed while request was in progress - it means the last cb will set to queue
  //private sendQueued: boolean = false;


  constructor(
    id: string,
    timeoutSec: number,
    resendTimeoutSec: number,
    logDebug: (msg: string) => void,
    sendCb: (...p: any[]) => any,
    sendParams: any[],
  ) {
    this.id = id;
    this.timeoutMs = timeoutSec * 1000;
    this.resendTimeoutMs = resendTimeoutSec * 1000;
    this.logDebug = logDebug;
    this.sendCb = sendCb;
    this.sendParams = sendParams;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  isCbSame(cb: (...p: any[]) => any): boolean {
    return this.sendCb === cb;
  }

  updateParams(sendParams: any[]) {
    // if (this.sendParams && !isEqual(this.sendParams, sendParams)) {
    //   this.sendQueued = true;
    // }

    this.sendParams = sendParams;
  }

  start() {
    if (this.startedTimeStamp) return;

    this.startedTimeStamp = new Date().getTime();

    this.trySend();
  }


  private trySend() {
    //this.sendQueued = false;

    this.sendCb(...this.sendParams)
      .then(this.success)
      .catch((err: Error) => {
        this.logDebug(`Sender ${this.id}: ${err}`);

        if (new Date().getTime() >= this.startedTimeStamp + this.timeoutMs) {
          // stop trying and call reject
          this.reject(err);

          return;
        }

        setTimeout(() => {
          // TODO: нужно вывести информативное сообщение
          this.logDebug(`--> resending - ${this.id}`);

          // try another one
          this.trySend();
        }, this.resendTimeoutMs);
      });
  }

  private success = (data: any) => {
    this.resolve(data);

    // // send queued
    // if (this.sendQueued) {
    //   this.trySend();
    // }
  }

}

export default class Sender {
  private readonly timeoutSec: number;
  private readonly resendTimeoutSec: number;
  private readonly logDebug: (msg: string) => void;
  private readonly logWarn: (msg: string) => void;
  private readonly requests: {[index: string]: SenderRequest} = {};


  constructor(
    timeoutSec: number,
    resendTimeoutSec: number,
    logDebug: (msg: string) => void,
    logWarn: (msg: string) => void
  ) {
    this.timeoutSec = timeoutSec;
    this.resendTimeoutSec = resendTimeoutSec;
    this.logDebug = logDebug;
    this.logWarn = logWarn;
  }

  destroy() {
    // TODO: add
  }


  isInProcess(id: string | undefined): boolean {
    const resolvedId: string = this.resolveId(id);

    return Boolean(this.requests[resolvedId]);
  }

  async send<T>(id: string | undefined, sendCb: (...p: any[]) => Promise<T>, ...params: any[]): Promise<T> {
    const resolvedId: string = this.resolveId(id);
    // TODO: review

    if (this.requests[resolvedId]) {
      this.addToQueue(resolvedId, sendCb, params);
    }
    else {
      // make new request
      this.startNewRequest(resolvedId, sendCb, params);
    }

    try {
      const result: any = await this.requests[resolvedId].promise;
      this.logDebug(`==> Request successfully finished ${resolvedId}`);

      delete this.requests[resolvedId];

      return result;
    }
    catch (err) {
      delete this.requests[resolvedId];

      throw err;
    }
  }


  private async startNewRequest(id: string, sendCb: (...p: any[]) => Promise<any>, params: any[]): Promise<any> {
    this.requests[id] = new SenderRequest(
      id,
      this.timeoutSec,
      this.resendTimeoutSec,
      this.logDebug,
      sendCb,
      params,
    );

    this.requests[id].start();
  }

  private async addToQueue(id: string, sendCb: (...p: any[]) => Promise<any>, params: any[]): Promise<any> {
    // update callback params
    this.requests[id].updateParams(params);

    if (!this.requests[id].isCbSame(sendCb)) {
      this.logWarn(`Callback has been changed for sender id "${id}"`);
    }

    // try {
    //   const result: any = await this.requests[id].queuePromise;
    //   // TODO: print in debug
    //   console.log(`==> Request successfully finished ${id}`);
    //
    //   delete this.requests[id];
    //
    //   return result;
    // }
    // catch (err) {
    //   delete this.requests[id];
    //
    //   throw err;
    // }
  }

  protected resolveId(id?: string): string {
    if (typeof id !== 'undefined') return String(id);

    return String(makeUniqNumber());
  }

}
