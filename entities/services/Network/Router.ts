import {NetworkMessage, SPECIAL_URI} from './Network';
import {encodeNetworkMessage} from './helpers';

export default class Router {
  destroy() {
    // TODO: add
  }


  cacheRoute(
    incomeMessageTo: string,
    incomeMessageFrom: string,
    incomeMessageRoute: string[],
  ) {
    // TODO: add
  }

  // hasToBeRouted(message: NetworkMessage): boolean {
  //   // TODO: add
  // }

  /**
   * Send new message, response or send message to the next host on a route
   * @param message
   */
  async send(
    toHostId: string,
    uri: string,
    payload: Uint8Array,
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

}
