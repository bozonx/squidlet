import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import Connection, {CONNECTION_SERVICE_TYPE, ConnectionRequest, ConnectionStatus} from 'system/interfaces/Connection';
import {lastItem} from 'system/lib/arrays';

import Network, {NETWORK_PORT, NetworkMessage, RESPONSE_STATUS, SPECIAL_URI} from './Network';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import ActiveHosts, {HostItem} from './ActiveHosts';
import {makeUniqId} from '../../../system/lib/uniqId';


type IncomeMessageHandler = (incomeMessage: NetworkMessage) => void;


/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Router {
  private context: Context;
  //private transport: Transport;
  private activeHosts: ActiveHosts;
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();
  //private incomeResponseEvents = new IndexedEvents<IncomeMessageHandler>();


  constructor(context: Context) {
    this.context = context;
    //this.transport = new Transport(context);
    this.activeHosts = new ActiveHosts();
  }

  init() {
    this.transport.init();
    this.transport.onIncomeMessage(this.handleIncomeTransportMessages);
    this.activeHosts.init();
  }

  destroy() {
    this.transport.destroy();
    this.activeHosts.destroy();
  }


  newMessageId(): string {
    // TODO: set 8 bytes length
    return makeUniqId();
  }

  // TODO: поидее не нужно делать обычными событиями,
  //  так как всеравно на 1 uri навешивается 1 обработчик
  onIncomeRequest(handler: IncomeMessageHandler): number {
    return this.incomeMessagesEvents.addListener(handler);
  }

  onIncomeResponse(cb: IncomeMessageHandler): number {

    // TODO: подниматьсобытия

    return this.incomeResponseEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.incomeMessagesEvents.removeListener(handlerIndex);
  }


  // cacheRoute(
  //   incomeMessageTo: string,
  //   incomeMessageFrom: string,
  //   incomeMessageRoute: string[],
  // ) {
  //   // TODO: add
  // }

  // hasToBeRouted(message: NetworkMessage): boolean {
  //   // TODO: add
  // }

  /**
   * Send new message or response
   * If requestId doesn't set it will be generated
   * If TTL doesn't set the default value will be used.
   * It just sends and doesn't wait for any response.
   * It it is the new request, make messageId by calling `router.newMessageId()`
   */
  async send(
    toHostId: string,
    uri: string,
    payload: Uint8Array,
    messageId: string,
    TTL?: number
  ) {
    const message: NetworkMessage = {
      TTL: this.context.config.config.defaultTtl,
      to: request.from,
      from: this.context.config.id,
      route: [],
      uri: SPECIAL_URI.routed,
      payload,
    };
    // TODO: если надо переслать уменьшить ttl
    // TODO: add
    encodeNetworkMessage(message);

    // const request: NetworkMessage = {
    //   to: toHostId,
    //   from: this.context.config.id,
    //   route: [],
    //   TTL: this.context.config.config.defaultTtl,
    //   uri,
    //   payload,
    // };
    //const encodedMessage: Uint8Array = encodeNetworkMessage(request);

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.payload) {
      throw new Error(`Result doesn't contains the payload`);
    }

    // TODO: принимать RESPONSE_STATUS - выводить в лог
    // TODO: ответ ждать в течении таймаута так как он может уйти далеко
    // TODO: add uri response

    const response: NetworkMessage = decodeNetworkMessage(connectionResponse.payload);

    // TODO: review

    // TODO:  может использовать такой метов в connection.sendResponseBack()
    // const result: ConnectionResponse = await connection.request(
    //   peerId,
    //   response.channel,
    //   // TODO: в случае ошибки отправить error
    //   response.payload,
    // );
  }

  // private makeResponse(to: string, uri: string, payload?: Uint8Array): NetworkMessage {
  //   return {
  //     TTL: this.context.config.config.defaultTtl,
  //     to,
  //     from: this.context.config.id,
  //     // TODO: сформировать маршрут, ближайший хост может быть другой
  //     route: [],
  //     uri,
  //     payload: payload || new Uint8Array(0),
  //   };
  // }

  // send message back which means that income message was routed.
  // return encodeNetworkMessage({
  //   TTL: this.context.config.config.defaultTtl,
  //   to: incomeMessage.from,
  //   from: this.context.config.id,
  //   route: [],
  //   uri: SPECIAL_URI.routed,
  //   payload: new Uint8Array(0),
  // });


  private handleIncomeTransportMessages(
    payload: Uint8Array,
    fromClosestHost: string,
    done: (result: Uint8Array) => void
  ) {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(payload);

    // TODO: нужно отправить запрос genHostId и потом зарегистрировать

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host send message further
      this.sendFurther(incomeMessage)
        .catch(this.context.log.error);
      // send status routed back
      return done(new Uint8Array([RESPONSE_STATUS.routed]));
    }
    // send status OK back
    return done(new Uint8Array([RESPONSE_STATUS.received]));
  }

  /**
   * Send mediate message or new one
   * @param incomeMessage
   */
  private async sendFurther(incomeMessage: NetworkMessage) {
    // TODO: add
  }

  // private cacheRoute(incomeMessage: NetworkMessage, peerId: string, connectionName: string) {
  //   const closestHostId: string = (incomeMessage.route.length)
  //     ? lastItem(incomeMessage.route)
  //     : incomeMessage.from;
  //
  //   this.activeHosts.cacheHost(closestHostId, peerId, connectionName);
  //
  //   if (incomeMessage.route.length) {
  //     //this.router.cacheRoute(incomeMessage.to, incomeMessage.from, incomeMessage.route);
  //   }
  // }
}
