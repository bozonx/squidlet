import RemoteCallMessage, {
  CallMethodPayload,
  CbCallPayload,
  CbResultPayload,
  ResultMethodPayload
} from '../interfaces/RemoteCallMessage';
import IndexedEvents from './IndexedEvents';
import {isPlainObject} from './lodashLike';


type MethodResultHandler = (payload: ResultMethodPayload) => void;
type CbResultHandler = (payload: CbResultPayload) => void;

export interface ObjectToCall {
  // method name: method()
  [index: string]: (...args: any[]) => Promise<any>;
}

const METHOD_MARK = '!!METHOD!!';

// TODO: решить как удалить хэндлеры колбюков когда они уже не нужны


/**
 * Call remote methods on other side.
 * This class the same for server and client, both of them have ability to call methods.
 * If there is a callback in arguments of method then it will be called when server call it.
 * This class doesn't support functions in method or callback result,
 * and doesn't support functions in callback arguments.
 */
export default class RemoteCallClient {
  readonly methodsResultEvents = new IndexedEvents<MethodResultHandler>();
  readonly cbsResultEvents = new IndexedEvents<CbResultHandler>();

  // TODO: make promise
  private readonly send: (message: RemoteCallMessage) => void;
  private readonly localMethods: {[index: string]: ObjectToCall};
  private readonly senderId: string;
  private readonly responseTimout: number;
  private readonly generateUniqId: () => string;
  // real callback of method which will be called
  private readonly callBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};
  private readonly fakeCallBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};


  constructor(
    send: (message: RemoteCallMessage) => any,
    // objects with methods which will be called from other host
    localMethods: {[index: string]: ObjectToCall} = {},
    senderId: string,
    responseTimout: number,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.localMethods = localMethods;
    this.senderId = senderId;
    this.responseTimout = responseTimout;
    this.generateUniqId = generateUniqId;
  }


  /**
   * Call method on remote machine
   */
  callMethod(objectName: string, method: string, ...args: any[]): Promise<any> {
    const payload: CallMethodPayload = {
      senderId: this.senderId,
      objectName,
      method,
      args: this.prepareArgsToSend(args),
    };
    const message: RemoteCallMessage = {
      type: 'callMethod',
      payload,
    };

    this.send(message);

    return this.waitForMethodResponse(objectName, method);
  }

  /**
   * Call this method when income message has come.
   * It calls local callbacks or methods
   */
  async incomeMessage(data: any) {
    if (!isPlainObject(data) || !data.type) return;

    const message: RemoteCallMessage = data;

    if (message.type === 'callMethod') {
      await this.callLocalMethod(data.payload);
    }
    else if (message.type === 'methodResult') {
      this.methodsResultEvents.emit(data.payload);
    }
    else if (message.type === 'cbCall') {
      await this.handleRemoteCbCall(data.payload);
    }
    else if (message.type === 'cbResult') {
      this.cbsResultEvents.emit(data.payload);
    }
  }


  /**
   * Wait while response of method is received
   */
  private waitForMethodResponse(objectName: string, method: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let wasFulfilled: boolean = false;
      let handlerIndex: number;
      const handler = (payload: ResultMethodPayload) => {
        // if not expected method - skip
        if (objectName !== payload.objectName || method !== payload.method) return;

        wasFulfilled = true;
        this.methodsResultEvents.removeListener(handlerIndex);

        if (payload.error) {
          return reject(new Error(payload.error));
        }

        resolve(payload.result);
      };

      handlerIndex = this.methodsResultEvents.addListener(handler);

      setTimeout(() => {
        if (wasFulfilled) return;

        wasFulfilled = true;
        this.methodsResultEvents.removeListener(handlerIndex);
        reject(`Remote dev set request timeout has been exceeded.`);
      }, this.responseTimout);
    });
  }

  private waitForResponse(
    events: IndexedEvents<(payload: {error?: string, result: any}) => void>,
    resolveSelfEventCb: (payload: any) => boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let wasFulfilled: boolean = false;
      let handlerIndex: number;
      const handler = (payload: {error?: string, result: any}) => {
        const isMyEvent: boolean = !resolveSelfEventCb(payload);

        if (!isMyEvent) return;

        wasFulfilled = true;
        events.removeListener(handlerIndex);

        if (payload.error) {
          return reject(new Error(payload.error));
        }

        resolve(payload.result);
      };

      handlerIndex = events.addListener(handler);

      setTimeout(() => {
        if (wasFulfilled) return;

        wasFulfilled = true;
        events.removeListener(handlerIndex);
        reject(`Remote dev set request timeout has been exceeded.`);
      }, this.responseTimout);
    });
  }

  private waitForCbResponse(cbId: string): Promise<any> {
    return this.waitForResponse(
      this.cbsResultEvents,
      (payload: CbResultPayload) => cbId !== payload.cbId
    );
  }

  /**
   * Call a real callback after a fake callback was called on the other side
   */
  private async handleRemoteCbCall(payload: CbCallPayload) {
    let result: any;
    let error;

    if (this.callBacks[payload.cbId]) {
      try {
        result = await this.callBacks[payload.cbId](...payload.args);
      }
      catch (err) {
        error = err;
      }
    }
    else {
      error = `Callback id "${payload.cbId}" hasn't been found`;
    }

    // next send response

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

  private async callLocalMethod(payload: CallMethodPayload) {
    let result: any;
    let error;

    if (this.localMethods[payload.objectName] && this.localMethods[payload.objectName][payload.method]) {
      const args: any[] = this.prepareArgsToCall(payload.args);

      try {
        result = await this.localMethods[payload.objectName][payload.method](...args);
      }
      catch (err) {
        error = err;
      }
    }
    else {
      error = `Method "${payload.objectName}.${payload.method}" hasn't been found`;
    }

    // next send response

    const resultPayload: ResultMethodPayload = {
      senderId: this.senderId,
      objectName: payload.objectName,
      method: payload.method,
      error,
      result,
    };
    const message: RemoteCallMessage = {
      type: 'cbResult',
      payload: resultPayload,
    };

    return this.send(message);
  }

  private prepareArgsToSend(rawArgs: any[]): any[] {
    const prapared: any[] = [];

    for (let arg of rawArgs) {
      if (typeof arg === 'function') {
        const methodId: string = this.generateUniqId();
        const methodMark = `${METHOD_MARK}${methodId}`;

        this.callBacks[methodId] = arg;
        prapared.push(methodMark);
      }
      else {
        prapared.push(arg);
      }
    }

    return prapared;
  }

  /**
   * Prepare args to call the method
   */
  private prepareArgsToCall(rawArgs: any[]): any[] {
    const prepared: any[] = [];

    for (let arg of rawArgs) {
      if (typeof arg === 'string' && arg.indexOf(METHOD_MARK) === 0) {
        const cbId: string = arg.slice(METHOD_MARK.length);
        const fakeCallback = this.makeFakeCb(cbId);

        this.fakeCallBacks[cbId] = fakeCallback;
        prepared.push(fakeCallback);
      }
      else {
        prepared.push(arg);
      }
    }

    return prepared;
  }

  /**
   * When fake cb is called it sends a message to other side to call a real message.
   * It doesn't support functions in arguments!
   */
  private makeFakeCb(cbId: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      const resultPayload: CbCallPayload = {
        senderId: this.senderId,
        cbId,
        // there is functions are not allowed!
        args,
      };
      const message: RemoteCallMessage = {
        type: 'cbCall',
        payload: resultPayload,
      };
      
      this.send(message);

      return this.waitForCbResponse(cbId);
    };
  }

}
