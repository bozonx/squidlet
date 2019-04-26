import RemoteCallMessage, {
  CallMethodPayload,
  ResultMethodPayload, REMOTE_CALL_MESSAGE_TYPES
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
  readonly methodsResultEvents = new IndexedEvents<MethodResultHandler>();

  private readonly remoteCallbacks: RemoteCallbacks;
  private readonly send: (message: RemoteCallMessage) => Promise<void>;
  private readonly localMethods: {[index: string]: ObjectToCall};
  // my host id
  private readonly senderId: string;
  private readonly responseTimout: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;


  constructor(
    send: (message: RemoteCallMessage) => Promise<void>,
    // objects with methods which will be called from other host
    localMethods: {[index: string]: ObjectToCall} = {},
    senderId: string,
    responseTimout: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.localMethods = localMethods;
    this.senderId = senderId;
    this.responseTimout = responseTimout;
    this.logError = logError;
    this.generateUniqId = generateUniqId;
    this.remoteCallbacks = new RemoteCallbacks(
      send,
      senderId,
      responseTimout,
      logError,
      generateUniqId
    );
  }


  /**
   * Call method on remote machine
   */
  async callMethod(objectName: string, method: string, ...args: any[]): Promise<any> {
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

    await this.send(message);

    return waitForResponse(
      this.methodsResultEvents,
      (payload: ResultMethodPayload) => {
        return objectName !== payload.objectName || method !== payload.method;
      },
      this.responseTimout
    );
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
      await this.callLocalMethod(payload);
    }
    else if (message.type === 'methodResult') {
      this.methodsResultEvents.emit(payload);
    }
    else {
      // try to recognize in remote callback class
      await this.remoteCallbacks.incomeMessage(message);
    }
  }

  async removeCallBack(cb: (...args: any[]) => Promise<any>) {
    this.remoteCallbacks.registerCallBack(cb);
  }

  async destroy() {
    this.remoteCallbacks.destroy();

    // TODO: отписаться от всех методов на сервере
  }

  
  // /**
  //  * Wait while response of method is received
  //  */
  // private waitForMethodResponse(objectName: string, method: string): Promise<any> {
  //   return this.waitForResponse(
  //     this.cbsResultEvents,
  //     (payload: ResultMethodPayload) => {
  //       return objectName !== payload.objectName || method !== payload.method;
  //     }
  //   );
  // }

  /**
   * Call real local method when message to do it has been received.
   */
  private async callLocalMethod(payload: CallMethodPayload) {
    const { result, error } = await this.safeCallMethod(payload.objectName, payload.method, payload.args);

    // next is sending response

    const resultPayload: ResultMethodPayload = {
      senderId: this.senderId,
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
