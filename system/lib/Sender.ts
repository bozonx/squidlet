import {isEqual} from './lodashLike';

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
  // if cb params was changed while request was in progress - it means the last cb will set to queue
  //private sendQueued: boolean = false;


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
        if (new Date().getTime() >= this.startedTimeStamp + this.timeoutMs) {
          // stop trying and call reject
          this.reject(err);

          return;
        }

        setTimeout(() => {

          // TODO: print in debug
          console.log(`--> resending - ${this.id}`);

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
  private readonly requests: {[index: string]: SenderRequest} = {};


  constructor(timeoutSec: number, resendTimeoutSec: number) {
    this.timeoutSec = timeoutSec;
    this.resendTimeoutSec = resendTimeoutSec;
  }


  async send<T>(id: string, sendCb: (...p: any[]) => Promise<T>, ...params: any[]): Promise<T> {

    // TODO: review

    if (this.requests[id]) {
      this.addToQueue(id, sendCb, params);
    }
    else {
      // make new request
      this.startNewRequest(id, sendCb, params);
    }

    try {
      const result: any = await this.requests[id].promise;
      // TODO: print in debug
      console.log(`==> Request successfully finished ${id}`);

      delete this.requests[id];

      return result;
    }
    catch (err) {
      delete this.requests[id];

      throw err;
    }
  }


  private async startNewRequest(id: string, sendCb: (...p: any[]) => Promise<any>, params: any[]): Promise<any> {
    this.requests[id] = new SenderRequest(
      id,
      this.timeoutSec,
      this.resendTimeoutSec,
      sendCb,
      params,
    );

    this.requests[id].start();
  }

  private async addToQueue(id: string, sendCb: (...p: any[]) => Promise<any>, params: any[]): Promise<any> {
    // update callback params
    this.requests[id].updateParams(params);

    if (!this.requests[id].isCbSame(sendCb)) {
      // TODO: use logger
      console.warn(`Callback has been changed for sender id "${id}"`);
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

}