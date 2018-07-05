import {ALL_TOPIC_MASK} from '../app/Events';
import Messenger from './Messenger';
import System from '../app/System';
import Request from './interfaces/Request';
import Response from './interfaces/Response';


export default class RequestResponse {
  private readonly system: System;
  private readonly messenger: Messenger;
  private readonly timeouts: {[index: string]: NodeJS.Timer} = {};


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  /**
   * Send request and wait for response.
   * It wait for 60 seconds and after that or if message hasn't delivered a promise will rejected.
   */
  request(toHost: string, category: string, topic: string, payload: any): Promise<Response> {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    return new Promise((resolve, reject) => {
      const request: Request = this.generateRequestMsg(toHost, category, topic, payload);

      const responseHandler = (error: Error | null, response: Response): void => {
        if (error) return reject(error);
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
  response(request: Request, error?: string, code?: number, payload?: any): Promise<void> {
    const respondMessage: Response = this.generateResponseMsg(request, error, code, payload);

    return this.messenger.$sendMessage(respondMessage);
  }

  private startWaitForResponse(
    category: string,
    requestId: string,
    handler: (error: Error | null, response: Response) => void
  ): void {
    const cb = (request: Request) => {
      if (!request.isResponse) return;
      if (request.requestId !== requestId) return;

      // TODO: использовать системный category
      // TODO: почему не топика ????? - наверное использовать системный топик

      this.system.events.removeListener(category, undefined, cb);
      handler(null, request);
    };

    this.timeouts[requestId] = setTimeout(() => {
      this.stopWaitForResponse(category, requestId);
    }, this.system.host.networkConfig.params.requestTimeout);

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
      payload,

      requestId: this.system.io.generateUniqId(),
      isRequest: true,
    };
  }

  private generateResponseMsg(request: Request, error?: string, code?: number, payload?: any): Response {
    return {
      topic: request.topic,
      category: request.category,
      from: this.system.host.id,
      to: request.from,
      payload,

      requestId: request.requestId,
      isResponse: true,
      error: error,
      code: code,
    };
  }

}
