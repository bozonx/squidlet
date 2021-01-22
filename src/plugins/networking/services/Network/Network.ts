import {callSafely} from 'squidlet-lib/src/common'
import {makeUniqId} from 'squidlet-lib/src/uniqId'

import EntityBase from '../../../../base/EntityBase'
import {
  decodeErrorPayload,
  decodeNetworkMessage, encodeErrorPayload,
  encodeNetworkPayload, extractMessageId,
  extractToHostIdFromPayload, validatePayload,
} from './networkHelpers'
import {NETWORK_CHANNELS, NETWORK_ERROR_CODE} from '../../constants'
import {BRIDGE_MANAGER_EVENTS, BridgesManager} from './BridgesManager'


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
  private bridgesManager!: BridgesManager
  private hostResolver: HostResolver
  private uriHandlers: Record<string, UriHandler> = {}


  async init() {
    this.bridgesManager = new BridgesManager()

    this.bridgesManager.on(
      BRIDGE_MANAGER_EVENTS.incomeMessage,
      this.handleIncomeMessage
    )
  }

  async destroy() {
    await this.hostResolver.destroy()
    await this.bridgesManager.destroy()

    this.uriHandlers = {}
  }


  async request(hostName: string, uri: string, payload: Uint8Array): Promise<Uint8Array> {
    const hostId = this.hostResolver.resoveHostIdByName(hostName)
    const messageId = makeUniqId()

    await this.sendMessage(NETWORK_CHANNELS.request, messageId, hostId, payload, uri)

    return this.waitForResponse(messageId)
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


  private handleIncomeMessage = (
    connectionId: string,
    channel: number,
    payload: Uint8Array
  ) => {
    if (channel !== NETWORK_CHANNELS.request) return

    try {
      validatePayload(payload)
    }
    catch (e) {
      // TODO: maybe return it back to the sender
      this.log.error(`Invalid request has been received`)

      return
    }

    const [
      fromHostId, toHostId, messageId, initialTtl, uri, payload
    ] = decodeNetworkMessage(payload)

    if (this.config.hostId === toHostId) {
      this.callLocalUriHandler(payload)
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
    toHostId: string,
    messageId: string,
    errorCode: NETWORK_ERROR_CODE,
    message?: string
  ) {
    const errorPayload = encodeErrorPayload(errorCode, message)

    this.sendMessage(NETWORK_CHANNELS.errorResponse, messageId, toHostId, errorPayload)
      .catch((e: Error) => {
        this.log.error(`Error sending error back: "${e}"`)
      })
  }

  private async sendMessage(
    channel: NETWORK_CHANNELS,
    messageId: string,
    toHostId: string,
    payload?: Uint8Array,
    uri?: string,
  ): Promise<void> {
    const connectionId = this.hostResolver.resoveConnection(toHostId)
    const completePayload = encodeNetworkPayload(
      this.config.hostId,
      toHostId,
      messageId,
      this.config.config.defaultTtl,
      payload,
      uri
    )

    await this.bridgesManager.send(
      connectionId,
      channel,
      completePayload
    )
  }

  private waitForResponse(messageId: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const handlerIndex = this.bridgesManager.on(
        BRIDGE_MANAGER_EVENTS.incomeMessage,
        (connectionId: string, channel: number, payload: Uint8Array) => {
          if (
            channel !== NETWORK_CHANNELS.successResponse
            && channel !== NETWORK_CHANNELS.errorResponse
          ) return

          if (extractMessageId(payload) !== messageId) return

          this.bridgesManager.off(handlerIndex)
          clearTimeout(timeout)

          if (channel === NETWORK_CHANNELS.successResponse) {
            resolve(payload)
          }
          else {
            const [errorCode, message] = decodeErrorPayload(payload)

            reject(
              `Error "${errorCode}"${(message) ? ': ' + message : ''}`
            )
          }
        }
      )

      const timeout = setTimeout(() =>  {
        this.bridgesManager.off(handlerIndex)
        reject(`Timeout has been exceeded`)
      }, this.config.config.responseTimoutSec)
    })
  }

}
