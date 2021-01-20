import IndexedEvents from 'squidlet-lib/src/IndexedEvents'

import EntityBase from '../../../../base/EntityBase'
import {
  decodeNetworkMessage,
  encodeNetworkPayload,
  extractToHostIdFromPayload
} from '../../network/networkHelpers'


export type NetworkIncomeRequestHandler = (
  uri: string,
  payload: Uint8Array,
  fromHost: string,
  //fromConnectionId: string
) => void


export default class Network extends EntityBase {
  private bridgesManager: BridgesManager
  private hostResolver: HostResolver
  private incomeMessagesEvent = new IndexedEvents<NetworkIncomeRequestHandler>()


  async init() {
    this.bridgesManager.onIncomeMessage(this.handleIncomeMessage)
  }


  async send(host: string, uri: string, payload: Uint8Array): Promise<void> {
    const connectionId: string = this.hostResolver.resoveConnection(host)
    const completePayload = encodeNetworkPayload(
      host,
      this.config.hostId,
      uri,
      payload,
      this.config.config.defaultTtl
    )

    await this.bridgesManager.send(connectionId, completePayload)
  }

  onIncomeMessage(cb: NetworkIncomeRequestHandler): number {
    return this.incomeMessagesEvent.addListener(cb)
  }

  off(handlerIndex: number) {
    this.incomeMessagesEvent.removeListener(handlerIndex)
  }


  private handleIncomeMessage = (completePayload: Uint8Array, connectionId: string) => {
    // TODO: validate message

    const toHostId: string = extractToHostIdFromPayload(completePayload)

    if (this.config.hostId === toHostId) {
      const [, fromHostId, uri, payload] = decodeNetworkMessage(completePayload)

      this.incomeMessagesEvent.emit(uri, payload, fromHostId)
    }
    else {
      // pass the message further
      const connectionId: string = this.hostResolver.resoveConnection(toHostId)

      // TODO: уменьшить TTL
      // TODO: если TTL уже 0 то поднять ошибку

      this.bridgesManager.send(connectionId, completePayload)
        .catch((e: Error) => {
          // TODO: вместо записи в лог надо отправить назад ошибку,
          //       но как-то связать ее с этим сообщением
          this.log.error(e)
        })
    }
  }

}
