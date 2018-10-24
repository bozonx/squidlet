import System from '../app/System';
import BridgeSubscriber from './BridgeSubscriber';
import BridgeResponder from './BridgeResponder';
import RequestResponse from './RequestResponse';
import Message from './interfaces/Message';
import Request from './interfaces/Request';
import {validateMessage} from '../helpers/helpers';
import HandlerWrappers from '../helpers/HandlerWrappers';
import OneWayMessages from './OneWayMessages';


export const PUBLISH_CATEGORY = 'publish';
export const REQUEST_RESPONSE_CATEGORY = 'request-response';
export const SYSTEM_CATEGORY = 'system';

type Handler = (payload: any, message: Message) => void;
type HandlerWrapper = (message: Message) => void;


/**
 * It receives and sends messages to network.
 * You can subscribe to all the local and remote messages.
 */
export default class Messenger {
  private readonly system: System;
  private readonly bridgeSubscriber: BridgeSubscriber;
  private readonly bridgeResponder: BridgeResponder;
  private readonly requestResponse: RequestResponse;
  private readonly oneWayMessages: OneWayMessages;
  private handlerWrappers: HandlerWrappers<Handler, HandlerWrapper> = new HandlerWrappers<Handler, HandlerWrapper>();

  constructor(system: System) {
    this.system = system;

    // TODO: может перенести в определение ???
    this.oneWayMessages = new OneWayMessages(this.system, this);
    this.bridgeSubscriber = new BridgeSubscriber(this.system, this);
    this.bridgeResponder = new BridgeResponder(this.system, this);
    this.requestResponse = new RequestResponse(this.system, this);
  }

  init(): void {
    this.oneWayMessages.init();
    this.bridgeSubscriber.init();
    this.bridgeResponder.init();
  }

  /**
   * Send one way message to specified host by hostId.
   * This message will rise on remote host as local event.
   * The promise will be fulfilled after message is delivered.
   */
  send(toHost: string, category: string, topic: string, payload?: any): Promise<void> {
    return this.oneWayMessages.send(toHost, category, topic, payload);
  }

  // /**
  //  * Send message to specified host by hostId.
  //  * This message will rise on remote host as local message
  //  * It doesn't wait for respond. But it wait for delivering of message.
  //  */
  // async publish(toHost: string, topic: string, payload?: any): Promise<void> {
  //
  //   // TODO: не совсем понятно назначение ф-и. Может сделать чисто для девайсов???
  //
  //   if (!topic) {
  //     throw new Error(`You have to specify a topic`);
  //   }
  //
  //   const message: Message = {
  //     category: PUBLISH_CATEGORY,
  //     topic,
  //     from: this.system.network.hostId,
  //     to: toHost,
  //     payload,
  //   };
  //
  //   await this.$sendMessage(message);
  // }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * If toHost isn't equal to current host - it will subscribe to events of remote host.
   */
  subscribe(toHost: string, topic: string, handler: (payload: any, message: Message) => void): void {

    // TODO: review

    if (!topic) {
      throw new Error(`You have to specify a topic`);
    }

    const wrapper = (message: Message) => {
      handler(message.payload, message);
    };

    this.handlerWrappers.addHandler(handler, wrapper);

    if (this.isLocalHost(toHost)) {
      // subscribe to local events
      return this.system.events.addListener(PUBLISH_CATEGORY, topic, wrapper);
    }

    // else subscribe to remote host's events
    this.bridgeSubscriber.subscribe(toHost, PUBLISH_CATEGORY, topic, wrapper);
  }

  /**
   * Unsubscribe of topic of remote or local host event handler which was set by subscribe method.
   * Handler has to be the same as has been specified to "subscribe" method previously
   */
  unsubscribe(toHost: string, topic: string, handler: (message: Message) => void): void {

    // TODO: review

    const wrapper: HandlerWrapper = this.handlerWrappers.getWrapper(handler) as HandlerWrapper;

    if (this.isLocalHost(toHost)) {
      // subscribe to local events
      this.system.events.removeListener(PUBLISH_CATEGORY, topic, handler);
    }
    else {
      // unsubscribe from remote host's events
      this.bridgeSubscriber.unsubscribe(toHost, PUBLISH_CATEGORY, topic, wrapper);
    }

    this.handlerWrappers.removeByHandler(handler);
  }

  request(toHost: string, topic: string, payload: any): Promise<any> {
    return this.requestResponse.request(toHost, topic, payload);
  }

  /**
   * Send response of received request.
   */
  response(request: Request, error?: string, code?: number, payload?: any): Promise<void> {
    return this.requestResponse.response(request, error, code, payload);
  }

  listenRequests(topic: string, handler: (payload: any) => void): void {
    this.requestResponse.listenRequests(topic, handler);
  }

  removeRequestsListener(topic: string, handler: (payload: any) => void): void {
    this.requestResponse.removeRequestsListener(topic, handler);
  }


  async $sendMessage(message: Message | Request): Promise<void> {
    // if message is addressed to local host - rise it immediately
    if (this.isLocalHost(message.to)) {
      this.system.events.emit(message.category, message.topic, message);

      return;
    }

    await this.system.network.send(message.to, message);
  }

  private isLocalHost(toHost?: string) {
    return !toHost || toHost === this.system.host.id;
  }

}
