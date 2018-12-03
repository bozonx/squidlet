import Messenger from './Messenger';
import System from '../app/System';
import Request from './interfaces/Request';
import Response from './interfaces/Response';
import categories from '../app/dict/categories';


type HandlerWrapper = (response: Response) => void;


export default class RequestResponse {
  private readonly system: System;
  private readonly messenger: Messenger;
  private readonly timeouts: {[index: string]: NodeJS.Timer} = {};
  // handlers by requestId
  private readonly handlers: {[index: string]: HandlerWrapper} = {};


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  /**
   * Send request and wait for response.
   * It wait for 60 seconds and after that or if message hasn't delivered a promise will rejected.
   */
  request(toHost: string, topic: string, payload: any): Promise<Response> {
    if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    return new Promise((resolve, reject) => {
      const request: Request = this.generateRequestMsg(toHost, topic, payload);

      const responseHandler = (error: Error | null, response: Response): void => {
        if (error) return reject(error);

        resolve(response);
      };

      // start waiting for response
      this.startWaitForResponse(request.requestId, responseHandler);

      // send request
      this.messenger.$sendMessage(request)
        .catch((err) => {
          this.stopWaitForResponse(request.requestId);
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

  /**
   * Listen for incoming request to generate response.
   */
  listenRequests(topic: string, handler: (payload: any) => void): void {
    this.system.events.addListener(categories.messengerRequestResponse, topic, handler);
  }

  removeRequestsListener(topic: string, handler: (payload: any) => void): void {
    this.system.events.removeListener(categories.messengerRequestResponse, topic, handler);
  }


  private startWaitForResponse(
    requestId: string,
    handler: (error: Error | null, response: Response) => void
  ): void {
    const wrapper = (response: Response) => {
      if (!response.isResponse) return;
      if (response.requestId !== requestId) return;

      // remove listener because we already have got a message
      this.system.events.removeCategoryListener(categories.messengerRequestResponse, wrapper);
      handler(null, response);
    };

    // start wait timeout for response
    this.timeouts[requestId] = setTimeout(() => {
      this.stopWaitForResponse(requestId);
    }, this.system.host.config.config.network.requestTimeout);

    this.handlers[requestId] = wrapper;

    // listen for all the topics of request category
    this.system.events.addCategoryListener(categories.messengerRequestResponse, wrapper);
  }

  private stopWaitForResponse(requestId: string): void {
    clearTimeout(this.timeouts[requestId]);
    delete this.timeouts[requestId];
    this.system.events.removeCategoryListener(categories.messengerRequestResponse, this.handlers[requestId]);
    delete this.handlers[requestId];
  }

  private generateRequestMsg(toHost: string, topic: string, payload: any): Request {
    return {
      topic,
      category: categories.messengerRequestResponse,
      from: this.system.host.id,
      to: toHost,
      payload,

      requestId: this.system.host.generateUniqId(),
      isRequest: true,
    };
  }

  private generateResponseMsg(request: Request, error?: string, code?: number, payload?: any): Response {
    return {
      topic: request.topic,
      category: categories.messengerRequestResponse,
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
