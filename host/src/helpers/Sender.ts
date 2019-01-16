
// TODO: добавить таймаут соединения если соединение слишком долгое

class SenderRequest {
  private sendCb?: (...p: any[]) => Promise<any>;
  private readonly onResolve: (data: any) => void;
  private readonly onReject: (err: Error) => void;
  private readonly id: string;
  private readonly timeoutMs: number;
  private readonly resendTimeoutMs: number;
  private startedTimeStamp: number = 0;


  constructor(
    id: string,
    timeoutSec: number,
    resendTimeoutSec: number,
    onResolve: (data: any) => void,
    onReject: (err: Error) => void
  ) {
    this.id = id;
    this.timeoutMs = timeoutSec * 1000;
    this.resendTimeoutMs = resendTimeoutSec * 1000;
    this.onResolve = onResolve;
    this.onReject = onReject;
  }

  setCb(sendCb: (...p: any[]) => Promise<any>) {
    this.sendCb = sendCb;
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


  send<T>(id: string, sendCb: (...p: any[]) => Promise<T>): Promise<T> {

    // TODO: можно не создавать постоянно новый промис

    return new Promise((resolve, reject) => {
      if (!this.requests[id]) {
        // make new request
        this.requests[id] = new SenderRequest(
          id,
          this.timeoutSec,
          this.resendTimeoutSec,
          (data: T) => {

            // TODO: print in debug
            console.log(`Request successfully finished ${id}`);

            delete this.requests[id];
            resolve(data);
          },
          (err: Error) => {
            delete this.requests[id];
            reject(err);
          }
        );
      }

      // update callback. It can send the last data
      this.requests[id].setCb(sendCb);
      this.requests[id].start();
    });
  }

}
