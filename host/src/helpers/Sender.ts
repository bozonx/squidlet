

class SenderRequest {
  private sendCb?: (...p: any[]) => Promise<any>;
  private readonly onResove: (data: any) => void;
  private readonly onReject: (err: Error) => void;
  private readonly timeout: number;
  private readonly resendTimout: number;
  private started: boolean = false;


  // TODO: add main timeout

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
    if (this.started) return;

    this.started = true;

    this.trySend();
  }


  private trySend() {
    if (!this.sendCb) throw new Error(`sendCb wasn't set`);

    this.sendCb()
      .then(this.finish)
      .catch((err: Error) => {
        // TODO: check main timeout

        setTimeout(() => {

        }, this.resendTimout);
      });
  }

  private finish = (data: any) => {
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
