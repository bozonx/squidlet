import {ALL_TOPIC_MASK} from '../app/Events';
import Messenger from './Messenger';
import System from '../app/System';
import Request from './interfaces/Request';


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
      const request: Request = this.generateRequestMsg(toHost, category, topic, payload);

      const responseHandler = (error: Error | null, response: Request): void => {
        // TODO: review
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
      this.messenger.$sendMessage(request)
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

    await this.messenger.$sendMessage(respondMessage);
  }

  private startWaitForResponse(
    category: string,
    requestId: string,
    handler: (error: Error | null, response: Request) => void
  ): void {
    const cb = (request: Request) => {
      if (!request.isResponse) return;
      if (request.requestId !== requestId) return;

      // TODO: add timeout
      // TODO: почему не топика ????? - наверное использовать системный топик

      this.system.events.removeListener(category, undefined, cb);
      handler(null, request);
    };

    this.system.events.addListener(category, undefined, cb);
  }

  private stopWaitForResponse(category: string, requestId: string): void {
    // TODO: отменить таймаут
    // TODO: удалить листенер
  }

  private generateRequestMsg(toHost: string, category: string, topic: string, payload: any): Request {
    return {
      topic,
      category,
      from: this.system.host.id,
      to: toHost,
      requestId: this.system.io.generateUniqId(),
      isResponse: false,
      payload,
    };
  }

}
