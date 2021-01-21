import {callSafely} from 'squidlet-lib/src/common'
import {makeUniqId} from 'squidlet-lib/src/uniqId'

import EntityBase from '../../../../base/EntityBase'
import {
  decodeNetworkMessage,
  encodeNetworkPayload,
  extractToHostIdFromPayload
} from '../../network/networkHelpers'
import {NETWORK_MESSAGE_TYPE} from '../../constants'


// export type NetworkIncomeRequestHandler = (
//   uri: string,
//   payload: Uint8Array,
//   fromHost: string,
//   //fromConnectionId: string
// ) => void

export type UriHandler = (
  payload: Uint8Array,
  fromHostId: string
) => Promise<Uint8Array | void>


export default class Network extends EntityBase {
  private bridgesManager: BridgesManager
  private hostResolver: HostResolver
  private uriHandlers: Record<string, UriHandler> = {}


  async init() {
    this.bridgesManager.onIncomeMessage(this.handleIncomeMessage)
  }


  async request(hostName: string, uri: string, payload: Uint8Array): Promise<Uint8Array> {
    const {connectionId, hostId} = this.hostResolver.resoveConnectionByName(hostName)
    // TODO: нужно ещё message id и тип сообщения - обыное или возврат ошибки
    // TODO: хотя для ошибок можно использовать отдельный канал
    const messageId = makeUniqId()
    const completePayload = encodeNetworkPayload(
      this.config.hostId,
      hostId,
      NETWORK_MESSAGE_TYPE.request,
      messageId,
      this.config.config.defaultTtl,
      uri,
      payload,
    )

    await this.bridgesManager.send(connectionId, completePayload)



    // TODO: нужно ещё ждать сообщение об ошибке если придет
  }

  registerUriHandler(uri: string, cb: UriHandler) {
    if (this.uriHandlers[uri]) {
      throw new Error(`Uri "${uri}" has been already registered.`)
    }

    this.uriHandlers[uri] = cb
  }

  removeUriHandler(uri: string) {
    delete this.uriHandlers[uri]
  }

  // onIncomeMessage(cb: NetworkIncomeRequestHandler): number {
  //   return this.incomeMessagesEvent.addListener(cb)
  // }
  //
  // off(handlerIndex: number) {
  //   this.incomeMessagesEvent.removeListener(handlerIndex)
  // }


  private handleIncomeMessage = (completePayload: Uint8Array, connectionId: string) => {
    // TODO: validate message - если не валидное то пишим в локальный лог

    const toHostId: string = extractToHostIdFromPayload(completePayload)

    if (this.config.hostId === toHostId) {
      this.callLocalUriHandler(completePayload)
    }
    else {
      // pass the message further
      const connectionId: string = this.hostResolver.resoveConnection(toHostId)

      // TODO: уменьшить TTL
      // TODO: если TTL уже 0 то вообще ничего не делать

      this.bridgesManager.send(connectionId, completePayload)
        .catch((e: Error) => {
          // TODO: вместо записи в лог надо отправить назад ошибку,
          //       но как-то связать ее с этим сообщением
          this.log.error(e)
        })
    }
  }

  private callLocalUriHandler(completePayload: Uint8Array) {
    const [, fromHostId, uri, messageId, payload] = decodeNetworkMessage(
      completePayload
    )

    if (!this.uriHandlers[uri]) {
      this.sendErrorBack(fromHostId, messageId, NETWORK_MESSAGE_TYPE.noHandler)

      return
    }

    callSafely(() => this.uriHandlers[uri](payload, fromHostId))
      .then((result: Uint8Array | void) => {
        // TODO: обратные payload может быть и void
        const connectionId = this.hostResolver.resoveConnection(hostId)
        const completePayload = encodeNetworkPayload(
          hostId,
          this.config.hostId,
          uri,
          result,
          NETWORK_MESSAGE_TYPE.request,
          messageId,
          this.config.config.defaultTtl
        )

        this.bridgesManager.send(connectionId, completePayload)
          .catch((e: Error) => {
            this.log.error(`Error sending message back: "${e}"`)
          })
      })
      .catch((e: Error) => {
        this.sendErrorBack(fromHostId, messageId, NETWORK_MESSAGE_TYPE.noHandler)
      })
  }

  private sendErrorBack(
    fromHostId: string,
    messageId: string,
    errorType: NETWORK_MESSAGE_TYPE,
    message?: string
  ) {
    const connectionId = this.hostResolver.resoveConnection(hostId)
    const completePayload = encodeNetworkPayload(
      hostId,
      this.config.hostId,
      uri,
      result,
      NETWORK_MESSAGE_TYPE.request,
      messageId,
      this.config.config.defaultTtl
    )

    this.bridgesManager.send(connectionId, completePayload)
      .catch((e: Error) => {
        this.log.error(`Error sending error back: "${e}"`)
      })
  }

}
