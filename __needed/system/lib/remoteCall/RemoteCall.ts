import RemoteCallMessage, {
  CallMethodPayload,
  ResultMethodPayload,
  REMOTE_CALL_MESSAGE_TYPES
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/RemoteCallMessage.js';
import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import {isPlainObject} from '../../../../../squidlet-lib/src/objects';
import RemoteCallbacks from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/remoteCall/RemoteCallbacks.js';
import {waitForResponse} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/remoteCall/helpers.js';


type MethodResultHandler = (payload: ResultMethodPayload) => void;

export type MethodCaller = (pathToMethod: string, ...args: any[]) => Promise<any>;


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
  private readonly methodCaller?: MethodCaller;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;


  constructor(
    // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
    send: (message: RemoteCallMessage) => Promise<void>,
    // function which is called a method and returns its result with promise
    methodCaller: MethodCaller | undefined,
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.methodCaller = methodCaller;
    this.responseTimoutSec = responseTimoutSec;
    this.logError = logError;
    this.generateUniqId = generateUniqId;
    this.remoteCallbacks = new RemoteCallbacks(send, responseTimoutSec, logError, generateUniqId);
  }


  /**
   * Call method on remote machine
   */
  async callMethod(pathToMethod: string, ...args: any[]): Promise<any> {
    // TODO: rename to callRemoteMethod
    const payload: CallMethodPayload = {
      method: pathToMethod,
      args: this.prepareArgsToSend(args),
    };
    const message: RemoteCallMessage = {
      type: 'callMethod',
      payload,
    };

    // TODO: refactor
    // TODO: поидее send promise не гарантированно отработает когда клиент получит сообщение или гарантированно???

    const sendPromise = this.send(message);
    const resultPromise = waitForResponse(
      this.methodsResultEvents,
      (payload: ResultMethodPayload) => {
        return pathToMethod === payload.method;
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

    // TODO: use throw or logError ???

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
    this.methodsResultEvents.destroy();
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
    const { result, error } = await this.safeCallMethod(payload.method, payload.args);

    // next is sending response

    const resultPayload: ResultMethodPayload = {
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

  private async safeCallMethod(pathToMethod: string, args: any[]): Promise<{result: any, error: string | undefined}> {
    if (!this.methodCaller) {
      throw new Error(`Can't call a method "${pathToMethod}" because there isn't a methodCaller`);
    }

    let result: any;
    let error: string | undefined;

    const preparedArgs: any[] = this.prepareArgsToCall(args);

    try {
      result = await this.methodCaller(pathToMethod, preparedArgs);
    }
    catch (err) {
      error = String(err);
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
