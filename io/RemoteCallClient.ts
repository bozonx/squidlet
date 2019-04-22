import RemoteCallMessage, {CallMethodPayload, ResultPayload} from './interfaces/RemoteCallMessage';
import IndexedEvents from '../system/helpers/IndexedEvents';
import {isPlainObject} from '../system/helpers/lodashLike';


type ResultHandler = (payload: ResultPayload) => void;


export interface Client {
  // send a message to server
  send(message: RemoteCallMessage): any;
  // listen whole income data from server
  addListener(cb: (data: any) => void): number;
  // remove listening of income data from server
  removeListener(handleIndex: number): void;
}


export default class RemoteCallClient {
  readonly resultMessages = new IndexedEvents<ResultHandler>();

  private readonly client: Client;
  private readonly responseTimout: number;
  private readonly incomeHandlerIndex: number;
  private readonly callBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};


  constructor(client: Client, responseTimout: number) {
    this.client = client;
    this.responseTimout = responseTimout;

    this.incomeHandlerIndex = this.client.addListener(this.onIncomeMessages);
  }


  callMethod(senderId: string, objectName: string, method: string, ...args: any[]): Promise<any> {
    const payload: CallMethodPayload = {
      senderId: senderId,
      objectName,
      method,
      args,
    };

    const data: RemoteCallMessage = {
      type: 'call',
      payload,
    };

    this.client.send(data);

    return this.waitForMethodResponse(objectName, method);
  }

  destroy() {
    this.client.removeListener(this.incomeHandlerIndex);
  }


  /**
   * Wait while response of method is received
   */
  protected waitForMethodResponse(objectName: string, method: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let wasFulfilled: boolean = false;
      let handlerIndex: number;
      const handler = (payload: ResultPayload) => {
        // if not expected method - skip
        if (objectName !== payload.objectName || method !== payload.method) return;

        wasFulfilled = true;
        this.resultMessages.removeListener(handlerIndex);

        if (payload.error) {
          return reject(new Error(payload.error));
        }

        resolve(payload.result);
      };

      handlerIndex = this.resultMessages.addListener(handler);

      setTimeout(() => {
        if (wasFulfilled) return;

        this.resultMessages.removeListener(handlerIndex);
        reject(`Remote dev set request timeout has been exceeded.`);
      }, this.responseTimout);
    });
  }


  private onIncomeMessages(data: any) {
    if (!isPlainObject(data) || !data.type) return;

    const message: RemoteCallMessage = data;

    if (message.type === 'result') {
      this.resultMessages.emit(data.payload);
    }
    // TODO: add cb listener
  }

}
