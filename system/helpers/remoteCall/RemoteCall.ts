import RemoteCallMessage, {
  CallMethodPayload,
  ResultMethodPayload,
  REMOTE_CALL_MESSAGE_TYPES
} from '../../interfaces/RemoteCallMessage';
import IndexedEvents from '../IndexedEvents';
import {isPlainObject} from '../lodashLike';
import RemoteCallbacks from './RemoteCallbacks';
import {waitForResponse} from './helpers';


type MethodResultHandler = (payload: ResultMethodPayload) => void;

export interface ObjectToCall {
  // method name: method()
  [index: string]: (...args: any[]) => Promise<any>;
}


/**
 * Call remote methods on other side.
 * This class the same for server and client, both of them have ability to call methods.
 * If there is a callback in arguments of method then it will be called when server call it.
 * This class doesn't support functions in method or callback result,
 * and doesn't support functions in callback arguments.
 */
export default class RemoteCall {
  private readonly methodsResultEvents = new IndexedEvents<MethodResultHandler>();
  private readonly remoteCallbacks: RemoteCallbacks;
  private readonly send: (message: RemoteCallMessage) => Promise<void>;
  private readonly localMethods: {[index: string]: ObjectToCall};
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;


  constructor(
    send: (message: RemoteCallMessage) => Promise<void>,
    // objects with methods which will be called from other host
    localMethods: {[index: string]: ObjectToCall} = {},
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.localMethods = localMethods;
    this.responseTimoutSec = responseTimoutSec;
    this.logError = logError;
    this.generateUniqId = generateUniqId;
    this.remoteCallbacks = new RemoteCallbacks(send, responseTimoutSec, logError, generateUniqId);
  }


  // /**
  //  * Send signal that connection is inited which removes previously set callback on other side
  //  */
  // async init() {
  //   const message: RemoteCallMessage = { type: 'init' };
  //
  //   await this.send(message);
  // }

  /**
   * Call method on remote machine
   */
  async callMethod(objectName: string, method: string, ...args: any[]): Promise<any> {
    const payload: CallMethodPayload = {
      objectName,
      method,
      args: this.prepareArgsToSend(args),
    };
    const message: RemoteCallMessage = {
      type: 'callMethod',
      payload,
    };

    // TODO: refactor

    const sendPromise = this.send(message);
    const resultPromise = waitForResponse(
      this.methodsResultEvents,
      (payload: ResultMethodPayload) => {
        return objectName === payload.objectName && method === payload.method;
      },
      this.responseTimoutSec
    );

    await sendPromise;

    return resultPromise;
  }

  /**
   * Call this method when income message has come.
   * It calls local callbacks or methods
   */
  async incomeMessage(rawMessage: {[index: string]: any}) {
    if (!isPlainObject(rawMessage) || !rawMessage.type) {
      return;
    }
    else if (!rawMessage.type || !REMOTE_CALL_MESSAGE_TYPES.includes(rawMessage.type)) {

      // TODO: может пытаться отдавать ответ с ошибкой ????

      return this.logError(`Io set: incorrect type of message ${JSON.stringify(rawMessage)}`);
    }

    const message: RemoteCallMessage = rawMessage as any;
    const payload: any = message.payload;

    if (message.type === 'callMethod') {
      if (!payload) {

        // TODO: отдать ошибку клиенту

        throw new Error(`Payload has to be specified for message type "callMethod"`);
      }

      await this.callLocalMethod(payload);
    }
    else if (message.type === 'methodResult') {
      if (!payload) {

        // TODO: отдать ошибку клиенту

        throw new Error(`Payload has to be specified for message type "methodResult"`);
      }

      this.methodsResultEvents.emit(payload);
    }
    // else if (message.type === 'init') {
    //   this.handleInitMessage();
    // }
    // else if (message.type === 'destroy') {
    //   this.handleDestroyMessage();
    // }
    else {
      // try to recognize in remote callback class
      await this.remoteCallbacks.incomeMessage(message);
    }
  }

  async destroy() {

    // TODO: прекратить ожидать ответы

    await this.remoteCallbacks.destroy();
    this.methodsResultEvents.removeAll();
  }


  // private handleInitMessage() {
  //   // TODO: !!!
  // }
  //
  // private handleDestroyMessage() {
  //   // TODO: !!!
  // }

  /**
   * Call real local method when message to do it has been received.
   */
  private async callLocalMethod(payload: CallMethodPayload) {
    const { result, error } = await this.safeCallMethod(payload.objectName, payload.method, payload.args);

    // next is sending response

    const resultPayload: ResultMethodPayload = {
      objectName: payload.objectName,
      method: payload.method,
      error,
      result,
    };
    const message: RemoteCallMessage = {
      type: 'methodResult',
      payload: resultPayload,
    };

    try {
      await this.send(message);
    }
    catch (err) {
      this.logError(`RemoteCall: Can't send a "methodResult" message: ${err}`);
    }
  }
  
  private async safeCallMethod(
    objectName: string,
    method: string,
    args: any[]
  ): Promise<{result: any, error: string}> {
    let result: any;
    let error;
    
    if (this.localMethods[objectName] && this.localMethods[objectName][method]) {
      const preparedArgs: any[] = this.prepareArgsToCall(args);

      try {
        result = await this.localMethods[objectName][method](...preparedArgs);
      }
      catch (err) {
        error = err;
      }
    }
    else {
      error = `Method "${objectName}.${method}" hasn't been found`;
    }
    
    return { result, error };
  }

  /**
   * Register callbacks and set special mark instead of it.
   * These callbacks will be wait of calling
   */
  private prepareArgsToSend(rawArgs: any[]): any[] {
    const prepared: any[] = [];

    for (let arg of rawArgs) {
      if (typeof arg === 'function') {
        // register callback and set special method mark instead of it
        const methodMark: string = this.remoteCallbacks.registerCallBack(arg);

        prepared.push(methodMark);
      }
      else {
        prepared.push(arg);
      }
    }

    return prepared;
  }

  /**
   * Prepare args to call the local method.
   * It replaces callback mark with fake callback which will send request back to call a real callback.
   */
  private prepareArgsToCall(rawArgs: any[]): any[] {
    const prepared: any[] = [];

    for (let arg of rawArgs) {
      if (typeof arg === 'string' && this.remoteCallbacks.isCallBackMark(arg)) {
        prepared.push(this.remoteCallbacks.makeFakeCallBack(arg));
      }
      else {
        prepared.push(arg);
      }
    }

    return prepared;
  }
  
}
