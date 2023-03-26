import System from '../System';
import BridgeSubscriber from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/BridgeSubscriber';
import BridgeResponder from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/BridgeResponder';
import RequestResponse from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/RequestResponse';
import Message from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';
import Request from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Request';
import OneWayMessages from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/OneWayMessages';


type Handler = (payload: any, message: Message) => void;


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


  isLocalHost(toHost?: string) {
    return !toHost || toHost === this.system.host.id;
  }

  /**
   * Emit local message (send local)
   */
  emit(category: string, topic: string, payload?: any) {
    this.oneWayMessages.emit(category, topic, payload);
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
  subscribeLocal(category: string, topic: string, handler: Handler): string {
    return this.subscribe(this.system.host.id, category, topic, handler);
  }

  subscribeCategoryLocal(category: string, handler: Handler): string {
    return this.subscribeCategory(this.system.host.id, category, handler);
  }

  /**
   * Listen to events of current or remote host.
   * If toHost isn't equal to current host - it will subscribe to events of remote host.
   */
  subscribe(toHost: string, category: string, topic: string, handler: Handler): string {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    const wrapper = (message: Message) => {
      handler(message && message.payload, message);
    };

    // else subscribe to remote host's events
    return this.bridgeSubscriber.subscribe(toHost, category, topic, wrapper);
  }

  subscribeCategory(toHost: string, category: string, handler: Handler): string {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }

    const wrapper = (message: Message) => {
      handler(message && message.payload, message);
    };

    // else subscribe to remote host's events
    return this.bridgeSubscriber.subscribeCategory(toHost, category, wrapper);
  }

  /**
   * Unsubscribe from events of remote or local host.
   * Handler has to be the same as has been specified to "subscribe" method previously.
   */
  unsubscribe(toHost: string, category: string, topic: string, handlerId: string): void {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    // unsubscribe from remote host's events
    this.bridgeSubscriber.unsubscribe(toHost, category, topic, handlerId);
  }

  unsubscribeCategory(toHost: string, category: string, handlerId: string): void {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }

    // unsubscribe from remote host's events
    this.bridgeSubscriber.unsubscribeCategory(toHost, category, handlerId);
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

  listenRequests(topic: string, handler: (payload: any) => void): number {
    return this.requestResponse.listenRequests(topic, handler);
  }

  removeRequestsListener(topic: string, handlerId: number): void {
    this.requestResponse.removeRequestsListener(topic, handlerId);
  }

  async $sendMessage(message: Message | Request): Promise<void> {
    // if message is addressed to local host - rise it immediately
    if (this.isLocalHost(message.to)) {
      this.system.events.emit(message.category, message.topic, message);

      return;
    }

    await this.system.network.send(message.to, message);
  }

}
