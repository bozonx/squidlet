import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import {makeUniqId} from 'system/lib/uniqId';

import {NETWORK_PORT, NetworkMessage} from './Network';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import PeerConnections from '../PeerConnections/PeerConnections';
import RouteResolver from './RouteResolver';
import {omitObj} from '../../../system/lib/objects';


type IncomeMessageHandler = (incomeMessage: NetworkMessage) => void;


/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Router {
  private context: Context;
  private routeResolver: RouteResolver = new RouteResolver();
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();

  private get peerConnections(): PeerConnections {
    return this.context.service.PeerConnections;
  }


  constructor(context: Context) {
    this.context = context;
  }

  init() {
    this.routeResolver.init();
    this.peerConnections.onIncomeMessage(this.handleIncomeMessages);

    this.peerConnections.onPeerConnect((peerId: string, connectionName: string) => {
      // TODO: сделать запрос имени хоста и зарегистрировать его
    });
    this.peerConnections.onPeerDisconnect((peerId: string, connectionName: string) => {
      this.routeResolver.deactivatePeer(peerId);
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
    // TODO: наверное убрать первый и последний элементы
    const route: string[] = this.routeResolver.resolveRoute(toHostId);
    const message: NetworkMessage = {
      TTL: TTL || this.context.config.config.defaultTtl,
      messageId,
      uri,
      to: toHostId,
      from: this.context.config.id,
      bearer: this.context.config.id,
      route,
      payload,
    };

    const encodedMessage: Uint8Array = encodeNetworkMessage(message);
    const peerId: string | undefined = this.routeResolver.resolvePeerId(
      route[0] || toHostId
    );

    if (!peerId) throw new Error(`No route to host`);

    // just send to peer
    await this.peerConnections.send(peerId, NETWORK_PORT, encodedMessage);
  }


  private handleIncomeMessages(peerId: string, port: number, payload: Uint8Array) {
    // listen only our port
    if (port !== NETWORK_PORT) return;

    const incomeMessage: NetworkMessage = decodeNetworkMessage(payload);

    // TODO: наверное просто route передать
    this.routeResolver.saveRoute([
      incomeMessage.from,
      ...incomeMessage.route,
      incomeMessage.to
    ]);
    this.routeResolver.activatePeer(peerId, incomeMessage.bearer);

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host then send message further
      this.sendFurther(incomeMessage)
        .catch(this.context.log.error);

      return;
    }
    // if it is ours - rise an event
    this.incomeMessagesEvents.emit(incomeMessage);
  }

  /**
   * Send mediate message further
   * @param incomeMessage
   */
  private async sendFurther(incomeMessage: NetworkMessage) {
    if (incomeMessage.TTL <= 0) {
      return this.context.log.warn(
        `TTL of network message has been exceeded: `
        + `${JSON.stringify(omitObj(incomeMessage, 'payload'))}`
        + `. Payload length is ${incomeMessage.payload.length}`
      );
    }

    const encodedMessage: Uint8Array = encodeNetworkMessage({
      ...incomeMessage,
      bearer: this.context.config.id,
      // decrement TTL on each host
      TTL: incomeMessage.TTL - 1,
    });
    // TODO: наверное отрезать пройденную часть маршрута
    const closestHostId: string | undefined = this.routeResolver.resolveClosestHostId([
      incomeMessage.from,
      ...incomeMessage.route,
      incomeMessage.to,
    ]);
    const peerId: string | undefined = this.routeResolver.resolvePeerId(closestHostId);

    if (!peerId) {
      throw new Error(`No route to host`);
    }
    // just send to peer
    await this.peerConnections.send(peerId, NETWORK_PORT, encodedMessage);
  }

}
