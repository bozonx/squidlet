

class SenderRequest {
  private sendCb?: (...p: any[]) => Promise<any>;

  constructor(sendCb: (...p: any[]) => Promise<any>) {

  }

  setData(dataToSend: any[]) {

  }

}

export default class Sender {
  private readonly requests: {[index: string]: SenderRequest} = {};

  send<T>(id: string, sendCb: (...p: any[]) => Promise<T>, dataToSend: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.requests[id]) {
        this.requests[id] = new SenderRequest();
      }

      const request: SenderRequest = this.requests[id];

      request.setData(dataToSend);



      // TODO: по завершению удалить requrest
    });
  }

}
