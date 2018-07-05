import {ALL_TOPIC_MASK} from '../app/Events';
import Messenger from './Messenger';
import System from '../app/System';


export default class RequestResponse {
  private readonly system: System;
  private readonly messenger: Messenger;


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  request(toHost: string, category: string, topic: string, payload: any): Promise<any> {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    return new Promise((resolve, reject) => {
      const request: Request = {
        topic,
        category,
        from: this.system.host.id,
        to: toHost,
        requestId: this.system.io.generateUniqId(),
        isResponse: false,
        payload,
      };

      // TODO: наверное надо отменить waitForResponse если сообщение не будет доставленно

      const responseHandler = (error: Error | null, response: Request): void => {
        if (error) return reject(error);

        if (Number.isInteger(response.errorCode as any) || response.errorMessage) {
          // TODO: review
          reject({
            message: response.errorMessage,
            code: response.errorCode,
          });
        }

        resolve(response);
      };

      // start waiting for response
      this.startWaitForResponse(request.category, request.requestId, responseHandler);

      // send request
      this.sendMessage(request)
        .catch((err) => {
          this.stopWaitForResponse(request.category, request.requestId);
          reject(err);
        });
    });
  }

  /**
   * Send response of received request.
   */
  async sendResponse(
    request: Request,
    error: { message: string, code: number } | null,
    payload?: any
  ): Promise<void> {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.system.host.id,
      to: request.from,
      requestId: request.requestId,
      isResponse: true,
      payload,
      errorMessage: error && error.message,
      errorCode: error && error.code,
    };

    await this.sendMessage(respondMessage);
  }

  private waitForResponse(category: string, requestId: string): Promise<Request> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (request: Request) => {
        if (!request.isResponse) return;
        if (request.requestId !== requestId) return;

        // TODO: почему не топика ?????

        this.system.events.removeListener(category, undefined, handler);
        resolve(request);
      };

      this.system.events.addListener(category, undefined, handler);
    }));
  }

  private startWaitForResponse(
    category: string,
    requestId: string,
    handler: (error: Error | null, response: Request) => void
  ): void {
    const cb = (request: Request) => {
      if (!request.isResponse) return;
      if (request.requestId !== requestId) return;

      // TODO: почему не топика ?????

      this.system.events.removeListener(category, undefined, handler);
      resolve(request);

      this.system.events.addListener(category, undefined, handler);
    };
  }

  private stopWaitForResponse(category: string, requestId: string): void {

  }

}
