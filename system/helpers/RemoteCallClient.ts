import RemoteCallMessage, {
  CallMethodPayload,
  CbCallPayload,
  CbResultPayload,
  ResultPayload
} from '../interfaces/RemoteCallMessage';
import IndexedEvents from './IndexedEvents';
import {isPlainObject} from './lodashLike';


type ResultHandler = (payload: ResultPayload) => void;


/**
 * Call remote methods on server.
 * If there is a callback in arguments of method then it will be called when server call it.
 * This class doesn't support functions in method or callback result,
 * and doesn't support functions in callback arguments.
 */
export default class RemoteCallClient {
  readonly resultMessages = new IndexedEvents<ResultHandler>();

  private readonly send: (message: RemoteCallMessage) => any;
  private readonly senderId: string;
  private readonly responseTimout: number;
  private readonly generateUniqId: () => string;
  private readonly callBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};


  constructor(
    send: (message: RemoteCallMessage) => any,
    senderId: string,
    responseTimout: number,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.senderId = senderId;
    this.responseTimout = responseTimout;
    this.generateUniqId = generateUniqId;
  }


  callMethod(objectName: string, method: string, ...args: any[]): Promise<any> {
    const payload: CallMethodPayload = {
      senderId: this.senderId,
      objectName,
      method,
      args: this.prepareArgs(args),
    };
    const message: RemoteCallMessage = {
      type: 'callMethod',
      payload,
    };

    this.send(message);

    return this.waitForMethodResponse(objectName, method);
  }

  /**
   * Call this method when income message has come
   */
  async incomeMessage(data: any) {
    if (!isPlainObject(data) || !data.type) return;

    const message: RemoteCallMessage = data;

    if (message.type === 'methodResult') {
      this.resultMessages.emit(data.payload);
    }
    else if (message.type === 'cbCall') {
      await this.handleRemoteCbCall(data.payload);
    }
  }


  /**
   * Wait while response of method is received
   */
  private waitForMethodResponse(objectName: string, method: string): Promise<any> {
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

        wasFulfilled = true;
        this.resultMessages.removeListener(handlerIndex);
        reject(`Remote dev set request timeout has been exceeded.`);
      }, this.responseTimout);
    });
  }

  private prepareArgs(rawArgs: any[]): any[] {
    const prapared: any[] = [];

    for (let arg of rawArgs) {
      if (typeof arg === 'function') {
        const methodId: string = this.generateUniqId();
        const methodMark = `!!METHOD!!${methodId}`;

        this.callBacks[methodId] = arg;
        prapared.push(methodMark);
      }
      else {
        prapared.push(arg);
      }
    }

    return prapared;
  }

  private async handleRemoteCbCall(payload: CbCallPayload) {
    let result: any;
    let error;

    if (this.callBacks[payload.cbId]) {
      try {
        result = await this.callBacks[payload.cbId](...payload.args);
      }
      catch (e) {
        error = e;
      }
    }
    else {
      error = `Method id "${payload.cbId}" hasn't been found`;
    }

    const resultPayload: CbResultPayload = {
      senderId: this.senderId,
      cbId: payload.cbId,
      error,
      result,
    };
    const message: RemoteCallMessage = {
      type: 'cbResult',
      payload: resultPayload,
    };

    return this.send(message);
  }

}
