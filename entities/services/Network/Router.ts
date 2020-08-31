import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import {makeUniqId} from 'system/lib/uniqId';

import {NETWORK_PORT, NetworkMessage} from './Network';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import P2pConnections from '../P2pConnections/P2pConnections';
import RouteResolver from './RouteResolver';


type IncomeMessageHandler = (incomeMessage: NetworkMessage) => void;


/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Router {
  private context: Context;
  private routeResolver: RouteResolver = new RouteResolver();
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();

  private get p2pConnections(): P2pConnections {
    return this.context.service.P2pConnections;
  }


  constructor(context: Context) {
    this.context = context;
  }

  init() {
    this.routeResolver.init();
    this.p2pConnections.onIncomeMessage(this.handleIncomeMessages);

    this.p2pConnections.onPeerConnect((peerId: string, connectionName: string) => {
      // TODO: сделать запрос имени хоста и зарегистрировать его
    });
    this.p2pConnections.onPeerDisconnect((peerId: string, connectionName: string) => {
      // TODO: remove active host
    });
  }

  destroy() {
    this.routeResolver.destroy();
    this.incomeMessagesEvents.destroy();
  }


  newMessageId(): string {
    // TODO: set 8 bytes length
    return makeUniqId();
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    return this.incomeMessagesEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.incomeMessagesEvents.removeListener(handlerIndex);
  }

  /**
   * Send new message
   * If TTL doesn't set the default value will be used.
   * It just sends and doesn't wait for any response.
   * If it is the new request, make messageId by calling `router.newMessageId()`
   */
  async send(
    toHostId: string,
    uri: string,
    payload: Uint8Array,
    messageId: string,
    TTL?: number
  ) {
    const route: string[] = this.routes.resolveRoute(toHostId);
    const message: NetworkMessage = {
      TTL: TTL || this.context.config.config.defaultTtl,
      messageId,
      uri,
      to: toHostId,
      from: this.context.config.id,
      route,
      payload,
    };

    const encodedMessage: Uint8Array = encodeNetworkMessage(message);
    const peerId: string | undefined = this.activeHosts.resolvePeerId(route[0] || toHostId);

    if (!peerId) {
      throw new Error(`No route to host`);
    }
    // just send to peer
    await this.p2pConnections.send(peerId, NETWORK_PORT, encodedMessage);
  }


  private handleIncomeMessages(
    peerId: string,
    port: number,
    payload: Uint8Array,
    connectionName: string
  ) {
    // listen only ours port
    if (port !== NETWORK_PORT) return;

    const incomeMessage: NetworkMessage = decodeNetworkMessage(payload);

    // TODO: зарегистрировать хост

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host send message further
      this.sendFurther(incomeMessage)
        .catch(this.context.log.error);

      return;
    }
    // if it is ours - rise an event
    this.incomeMessagesEvents.emit(incomeMessage);
  }

  /**
   * Send mediate message or new one
   * @param incomeMessage
   */
  private async sendFurther(incomeMessage: NetworkMessage) {
    // TODO: add
    // TODO: если надо переслать уменьшить ttl
    // TODO: нужно ли устанавливать статус routed ???

  }

}
