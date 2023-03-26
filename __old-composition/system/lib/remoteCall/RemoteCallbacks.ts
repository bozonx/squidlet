import RemoteCallMessage, {
  CallCbPayload,
  ResultCbPayload,
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/RemoteCallMessage.js';
import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import {waitForResponse} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/remoteCall/helpers.js';
import {clearObject} from '../../../../../squidlet-lib/src/objects';


type CbResultHandler = (payload: ResultCbPayload) => void;

const METHOD_MARK = '!!METHOD!!';


/**
 * Call remote methods on other side.
 * This class the same for server and client, both of them have ability to call methods.
 * If there is a callback in arguments of method then it will be called when server call it.
 * This class doesn't support functions in method or callback result,
 * and doesn't support functions in callback arguments.
 */
export default class RemoteCallbacks {
  private readonly cbsResultEvents = new IndexedEvents<CbResultHandler>();
  // real callback of method which will be called
  private readonly callBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};
  private readonly fakeCallBacks: {[index: string]: (...args: any[]) => Promise<any>} = {};
  private readonly send: (message: RemoteCallMessage) => Promise<void>;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;


  constructor(
    send: (message: RemoteCallMessage) => Promise<void>,
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.send = send;
    this.responseTimoutSec = responseTimoutSec;
    this.logError = logError;
    this.generateUniqId = generateUniqId;
  }


  /**
   * Register real callback and make special mark.
   */
  registerCallBack(cb: (...args: any[]) => Promise<any>): string {
    const methodId: string = this.generateUniqId();
    const methodMark = `${METHOD_MARK}${methodId}`;

    this.callBacks[methodId] = cb;

    return methodMark;
  }

  /**
   * Make fake callback using special mark.
   * Calling this callback will send request to other side to call the real one.
   */
  makeFakeCallBack(mark: string): (...args: any[]) => Promise<any> {
    const cbId: string = mark.slice(METHOD_MARK.length);
    const fakeCallback = this.makeFakeCb(cbId);

    this.fakeCallBacks[cbId] = fakeCallback;

    return fakeCallback;
  }

  isCallBackMark(mark: string): boolean {
    return mark.indexOf(METHOD_MARK) === 0;
  }

  /**
   * Call this method when income message has come.
   * It calls local callbacks or methods
   */
  async incomeMessage(message: RemoteCallMessage) {
    const payload: any = message.payload;

    if (message.type === 'cbCall') {
      if (!payload) {

        // TODO: отдать ошибку клиенту

        throw new Error(`Payload has to be specified for message type "cbCall"`);
      }

      await this.handleRemoteCbCall(payload);
    }
    else if (message.type === 'cbResult') {
      if (!payload) {

        // TODO: отдать ошибку клиенту

        throw new Error(`Payload has to be specified for message type "cbResult"`);
      }

      this.cbsResultEvents.emit(payload);
    }
  }

  async destroy() {
    // TODO: прекратить ожидать ответы
    // const destroyMessage: RemoteCallMessage = {
    //   type: 'destroy',
    // };
    //
    // await this.send();

    this.cbsResultEvents.destroy();
    clearObject(this.callBacks);
    clearObject(this.fakeCallBacks);
  }

  /**
   * When fake cb is called it sends a message to other side to call a real message.
   * It doesn't support functions in arguments!
   */
  private makeFakeCb(cbId: string): (...args: any[]) => Promise<any> {
    return async (...args: any[]): Promise<any> => {
      const resultPayload: CallCbPayload = {
        cbId,
        // there is functions are not allowed!
        args,
      };
      const message: RemoteCallMessage = {
        type: 'cbCall',
        payload: resultPayload,
      };

      // TODO: refactor

      const sendPromise = this.send(message);

      // wait for result of real cb
      const resultPromise = waitForResponse(
        this.cbsResultEvents,
        (payload: ResultCbPayload) => cbId === payload.cbId,
        this.responseTimoutSec
      );

      try {
        await sendPromise;
      }
      catch (err) {
        return this.logError(`RemoteCall: Can't send a "cbResult" message: ${err}`);
      }

      return resultPromise;
    };
  }

  /**
   * Call a real callback after a fake callback was called on the other side
   */
  private async handleRemoteCbCall(payload: CallCbPayload) {
    let result: any;
    let error: string | undefined;


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

    const resultPayload: ResultCbPayload = {
      cbId: payload.cbId,
      error,
      result,
    };
    const message: RemoteCallMessage = {
      type: 'cbResult',
      payload: resultPayload,
    };

    try {
      await this.send(message);
    }
    catch (err) {
      this.logError(`RemoteCall: Can't send a "cbResult" message: ${err}`);
    }
  }

}
