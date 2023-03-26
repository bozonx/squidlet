import {makeUniqId} from 'squidlet-lib/src/uniqId'

import Network from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/Network.js'
import {NETWORK_CHANNELS} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/constants.js'
import {
  encodeEventEmitPayload,
  encodeEventOffPayload,
  encodeEventRegisterPayload
} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/networkHelpers.js'
import {BRIDGE_MANAGER_EVENTS} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/BridgesManager.js'


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


  // TODO: мы поднимает просто событие,
  //  а уже потом смотрится кто на нас подписан и туда рассылается
  emit(
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
    // TODO: лучше убрать uri
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
