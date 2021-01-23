import Network from './Network'
import {NETWORK_CHANNELS} from '../../constants'
import {makeUniqId} from '../../../../../../squidlet-lib/src/uniqId'
import {encodeEventEmitPayload, encodeEventOffPayload, encodeEventRegisterPayload} from './networkHelpers'
import {BRIDGE_MANAGER_EVENTS} from './BridgesManager'


export class UriEvents {
  private network: Network
  private localSideHandlers: Record<string, (...params: any[]) => void> = {}


  constructor(network: Network) {
    this.network = network

    this.network.bridgesManager.on(
      BRIDGE_MANAGER_EVENTS.incomeMessage,
      this.handleIncomeMessage
    )
  }


  emit(
    hostName: string,
    uri: string,
    eventName: string | number,
    ...params: any[]
  ) {
    const hostId = this.network.hostResolver.resolveHostIdByName(hostName)
    const messageId = makeUniqId()
    const payload = encodeEventEmitPayload(eventName, ...params)

    this.network.$sendMessage(
      NETWORK_CHANNELS.eventOffRequest,
      messageId,
      hostId,
      payload,
      uri
    )
      .catch((e: Error) => this.network.context.log.error(String(e)))
  }

  async on(
    hostName: string,
    uri: string,
    eventName: string | number,
    cb: (...params: any[]) => void
  ): Promise<string> {
    const hostId = this.network.hostResolver.resolveHostIdByName(hostName)
    const messageId = makeUniqId()
    const handlerId = makeUniqId()
    const payload = encodeEventRegisterPayload(eventName, handlerId)

    await this.network.$sendMessage(
      NETWORK_CHANNELS.eventRegisterRequest,
      messageId,
      hostId,
      payload,
      uri
    )

    //  TODO: нужно слушать ответ что все ок

    this.localSideHandlers[handlerId] = cb

    return handlerId
  }

  async off(
    hostName: string,
    uri: string,
    handlerId: string
  ) {
    const hostId = this.network.hostResolver.resolveHostIdByName(hostName)
    const messageId = makeUniqId()
    const payload = encodeEventOffPayload(handlerId)

    await this.network.$sendMessage(
      NETWORK_CHANNELS.eventOffRequest,
      messageId,
      hostId,
      payload,
      uri
    )

    //  TODO: нужно слушать ответ что все ок

    delete this.localSideHandlers[handlerId]
  }


  private handleIncomeMessage = (
    connectionId: string,
    channel: number,
    messagePayload: Uint8Array
  ) => {

  }

}
