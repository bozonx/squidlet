import System from '../app/System';
import {ALL_TOPIC_MASK} from '../app/Events';
import BridgeSubscriber from './BridgeSubscriber';
import BridgeResponder from './BridgeResponder';
import RequestResponse from './RequestResponse';
import Message from './interfaces/Message';
import Request from './interfaces/Request';
import {validateMessage} from '../helpers/helpers';
import HandlerWrappers from '../helpers/HandlerWrappers';


export const PUBLISH_CATEGORY = 'publish';
export const REQUEST_CATEGORY = 'request';
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
  private handlerWrappers: HandlerWrappers<Handler, HandlerWrapper> = new HandlerWrappers<Handler, HandlerWrapper>();

  constructor(system: System) {
    this.system = system;

    // TODO: может перенести в определение ???
    this.bridgeSubscriber = new BridgeSubscriber(this.system, this);
    this.bridgeResponder = new BridgeResponder(this.system, this);
    this.requestResponse = new RequestResponse(this.system, this);
  }

  init(): void {
    this.bridgeSubscriber.init();
    this.bridgeResponder.init();

    // listen income messages from remote host and rise them on a local host as local messages
    this.system.network.listenIncome(this.handleIncomeMessages);
  }

  /**
   * Send message to specified host by hostId.
   * This message will rise on remote host as local message
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(toHost: string, topic: string, payload?: any): Promise<void> {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    const message: Message = {
      category: PUBLISH_CATEGORY,
      topic,
      from: this.system.network.hostId,
      to: toHost,
      payload,
    };

    await this.$sendMessage(message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * If toHost isn't equal to current host - it will subscribe to events of remote host.
   */
  subscribe(toHost: string, topic: string, handler: (payload: any, message: Message) => void): void {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    const wrapper = (message: Message) => {
      handler(message.payload, message);
    };

    this.handlerWrappers.addHandler(handler, wrapper);

    if (toHost === this.system.host.id) {
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
    if (toHost === this.system.host.id) {
      // subscribe to local events
      this.system.events.removeListener(PUBLISH_CATEGORY, topic, handler);

      return;
    }

    this.handlerWrappers.removeByHandler(handler);
    // unsubscribe from remote host's events

    // TODO: get wrapper

    this.bridgeSubscriber.unsubscribe(toHost, PUBLISH_CATEGORY, topic, handler);
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

  async $sendMessage(message: Message | Request): Promise<void> {
    // if message is addressed to local host - rise it immediately
    if (message.to === this.system.host.id) {
      this.system.events.emit(message.category, message.topic, message);

      return;
    }

    await this.system.network.send(message.to, message);
  }

  /**
   * Rise all the income messages as local events.
   */
  private handleIncomeMessages = (error: Error | null, message: Message): void => {
    // put error to log
    if (error) return this.system.log.error(error.toString());

    if (!validateMessage(message)) {
      return this.system.log.error(`Incorrect message ${JSON.stringify(message)}`);
    }

    this.system.events.emit(message.category, message.topic, message);
  }

}
