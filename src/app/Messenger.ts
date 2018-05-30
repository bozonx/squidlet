import App from './App';
import MessageInterface from './interfaces/MessageInterface';
import AddressInterface from './interfaces/AddressInterface';
import { generateUniqId } from '../helpers/helpers';


/**
 * It's heart of app. It receives and sends messages to router.
 * You can subscribe to all the messages.
 */
export default class Messenger {
  private readonly _app: App;

  constructor(app) {
    this._app = app;
  }

  /**
   * Send message to specified host.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(to: AddressInterface, category: string, topic: string, payload: any): Promise<void> {
    const message = {
      topic,
      category,
      from: this._getHostAddress(to.type, to.bus),
      to,
      payload,
    };

    await this._app.router.publish(message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * It omits responds of requests.
   */
  subscribe(category: string, topic: string, handler: (message: MessageInterface) => void) {
    this._app.router.subscribe((message: MessageInterface) => {
      if (message.category !== category || message.topic !== topic) return;
      if (message.request) return;

      if (message.category === category && message.topic === topic) {
        handler(message);
      }
    });
  }

  unsubscribe() {
    // TODO: do it
    //this._app.router.unsubscribe();
  }

  request(to: AddressInterface, category: string, topic: string, payload: any): Promise<any> {
    const message = {
      topic,
      category,
      from: this._getHostAddress(to.type, to.bus),
      to,
      request: {
        id: generateUniqId(),
        isRequest: true,
      },
      payload,
    };

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить если сообщение не будет доставленно

      this._waitForMyMessage(message.request.id)
        .then((response: MessageInterface) => {
          if (response.error) return reject(response.error);

          resolve(response);
        })
        .catch(reject);

      this._app.router.publish(message)
        .catch(reject);
    });
  }

  listenRequests(category: string, handler: (message: MessageInterface) => void) {
    // it will be called on each income message to current host
    const callback = (message: MessageInterface) => {
      if (!message.request || message.category !== category) return;

      handler(message);
    };

    this._app.router.subscribe(callback);
  }

  sendRespondMessage(
    request: MessageInterface,
    payload: any = null,
    error: { message: string, code: number } = undefined
  ) {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this._getHostAddress(request.from.type, request.from.bus),
      to: request.from,
      request: {
        id: request.request.id,
        isResponse: true,
      },
      payload,
      error,
    };

    this._app.router.publish(respondMessage);
  }

  private _waitForMyMessage(messageId: string): Promise<MessageInterface> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (message: MessageInterface) => {
        if (!message.request || message.request.id !== messageId) return;

        this._app.router.unsubscribe(handler);

        resolve(message);
      };

      this._app.router.subscribe(handler);
    }));
  }

  private _getHostAddress(type: string, bus: string): AddressInterface {
    return {
      hostId: this._app.getHostId(),
      type,
      bus,
      address: this._app.router.getMyAddress(type, bus),
    }
  }

}
