

// TODO: подключиться ко всем соединениям
// TODO: слушать приходящие запросы и либо отправлять в роутер, либо если
//       это конечный пункт то в network

import {serializeJson} from 'squidlet-lib'
import {NetworkService} from './NetworkService.js'
import type {NetworkIncomeRequest, NetworkSendRequest} from '../../types/Network.js'


export type ConnectionsIncomeMsgHandler = () => void


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
  }

  async stop(force?: boolean) {
  }



  /**
   * Send request but not wait for response
   * Promise will be fulfilled when IO send data
   * @param request
   */
  async send(request: NetworkSendRequest): Promise<void> {
    const msg: NetworkIncomeRequest = {
      // TODO: get my id
      fromHostId: '',
      toHostId: request.toHostId,
      routeHosts: [],
      category: request.category,
      requestId: request.requestId,
      payload: serializeJson(request.payload),
    }
    const serialized = serializeJson(msg)

    await this.pushToConnection(request.toHostId, serialized)
  }


  private async pushToConnection(toHostId: string, msgBin: Uint8Array): Promise<void> {
    // TODO: resolve nearest host and connection

  }

}
