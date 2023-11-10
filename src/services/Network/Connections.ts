

// TODO: подключиться ко всем соединениям
// TODO: при получении сообщения не забыть десериализовать payload
// TODO: слушать приходящие запросы и либо отправлять в роутер, либо если
//       это конечный пункт то в network

import {serializeJson} from 'squidlet-lib'
import type {NetworkService} from './NetworkService.js'
import type {
  NetworkIncomeRequest,
  NetworkMessageBase,
  NetworkSendRequest
} from '../../types/Network.js'
import type {NetworkIncomeResponse} from '../../types/Network.js'


export type ConnectionsIncomeMsgHandler = (incomeMsg: NetworkIncomeRequest | NetworkIncomeResponse) => void


export class Connections {
  private readonly network: NetworkService
  private incomeMsgHandler?: ConnectionsIncomeMsgHandler


  constructor(network: NetworkService) {
    this.network = network
  }

  async destroy() {
  }

  async start(handler: ConnectionsIncomeMsgHandler) {
    this.incomeMsgHandler = handler

    // TODO: слушать все интерфейсы
    // TODO: call incomeMsgHandler
    // TODO: проверить что это мое сообщение для network а не для чего-то ещё
  }

  async stop(force?: boolean) {
    delete this.incomeMsgHandler
  }



  /**
   * Send request but not wait for response
   * Promise will be fulfilled when IO send data
   * @param request
   */
  async send(request: NetworkSendRequest & Pick<NetworkMessageBase, 'requestId'>): Promise<void> {
    const msg: NetworkIncomeRequest = {
      // TODO: get my id
      fromHostId: '',
      toHostId: request.toHostId,
      routeHosts: [],
      category: request.category,
      requestId: request.requestId,

      // TODO: может быть undefined
      payload: serializeJson(request.payload),
    }

    await this.pushToConnection(request.toHostId, serializeJson(msg))
  }


  private async pushToConnection(toHostId: string, msgBin: Uint8Array): Promise<void> {
    // TODO: resolve nearest host and connection
    // TODO: send message to selected connection
  }

}
