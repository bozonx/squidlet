import System from '../app/System';
import BridgeSubscriber from './BridgeSubscriber';
import BridgeResponder from './BridgeResponder';
import RequestResponse from './RequestResponse';
import Message from './interfaces/Message';
import Request from './interfaces/Request';
import OneWayMessages from './OneWayMessages';


type Handler = (message: Message) => void;


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

  /**
   * Listen to events of current or remote host.
   * If toHost isn't equal to current host - it will subscribe to events of remote host.
   */
  subscribe(toHost: string, category: string, topic: string, handler: Handler): void {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    if (this.isLocalHost(toHost)) {
      // subscribe to local events
      return this.system.events.addListener(category, topic, handler);
    }

    // else subscribe to remote host's events
    this.bridgeSubscriber.subscribe(toHost, category, topic, handler);
  }

  /**
   * Unsubscribe from events of remote or local host.
   * Handler has to be the same as has been specified to "subscribe" method previously.
   */
  unsubscribe(toHost: string, category: string, topic: string, handler: Handler): void {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    if (this.isLocalHost(toHost)) {
      // subscribe to local events
      this.system.events.removeListener(category, topic, handler);
    }
    else {
      // unsubscribe from remote host's events
      this.bridgeSubscriber.unsubscribe(toHost, category, topic, handler);
    }
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
