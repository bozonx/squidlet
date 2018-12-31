

class SenderRequest {
  private sendCb?: (...p: any[]) => Promise<any>;
  private readonly onResove: (data: any) => void;
  private readonly onReject: (err: Error) => void;
  private readonly timeout: number;
  private readonly resendTimout: number;
  private startedTimeStamp: number = 0;


  constructor(timeout: number, resendTimout: number, onResove: (data: any) => void, onReject: (err: Error) => void) {
    this.timeout = timeout;
    this.resendTimout = resendTimout;
    this.onResove = onResove;
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
        if (new Date().getTime() >= this.startedTimeStamp + this.timeout) {
          // stop trying and call reject
          this.onReject(err);

          return;
        }

        setTimeout(() => {
          // try another one
          this.trySend();
        }, this.resendTimout);
      });
  }

  private success = (data: any) => {
    this.onResove(data);
  }

}

export default class Sender {
  private readonly requests: {[index: string]: SenderRequest} = {};

  send<T>(id: string, sendCb: (...p: any[]) => Promise<T>): Promise<T> {

    // TODO: можно не создавать постоянно новый промис

    return new Promise((resolve, reject) => {
      if (!this.requests[id]) {
        // make new request
        this.requests[id] = new SenderRequest(
          (data: T) => {
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
