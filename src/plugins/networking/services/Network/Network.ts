import {callSafely} from 'squidlet-lib/src/common'
import {makeUniqId} from 'squidlet-lib/src/uniqId'
import IndexedEvents from 'squidlet-lib/src/IndexedEvents'
import {JsonTypes} from 'squidlet-lib/src/interfaces/Types'

import EntityBase from '../../../../base/EntityBase'
import {
  decodeErrorPayload,
  decodeNetworkMessage,
  encodeErrorPayload,
  encodeNetworkMessage,
} from './networkHelpers'
import {NETWORK_CHANNELS, NETWORK_ERROR_CODE} from '../../constants'
import {BRIDGE_MANAGER_EVENTS, BridgesManager} from './BridgesManager'
import {HostResolver} from './HostResolver'


export type UriHandler = (
  data: JsonTypes | Uint8Array,
  fromHostId: string
) => Promise<JsonTypes | Uint8Array>

type IncomeResponseHandler = (
  channel: NETWORK_CHANNELS,
  fromHostId: string,
  messageId: string,
  payload: Uint8Array
) => void


export default class Network extends EntityBase {
  private bridgesManager!: BridgesManager
  private hostResolver!: HostResolver
  private uriHandlers: Record<string, UriHandler> = {}
  private incomeResponsesEvents = new IndexedEvents<IncomeResponseHandler>()


  async init() {
    this.bridgesManager = new BridgesManager()
    this.hostResolver = new HostResolver()

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
    const hostId = this.hostResolver.resolveHostIdByName(hostName)
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
    messagePayload: Uint8Array
  ) => {
    // skip odd channels
    if (![
      NETWORK_CHANNELS.request,
      NETWORK_CHANNELS.successResponse,
      NETWORK_CHANNELS.errorResponse
    ].includes(channel)) return

    let decodedMessage: [string, string, string, number, Uint8Array, string]

    try {
      decodedMessage = decodeNetworkMessage(messagePayload)
    }
    catch (e) {
      this.log.error(
        `Invalid request has been received. ` +
        `Connection id: ${connectionId}.channel: ${channel}`
      )

      return
    }

    const [fromHostId, toHostId, messageId, ttl, payload, uri] = decodedMessage

    if (this.config.hostId === toHostId) {
      // the destination is current host
      if (channel === NETWORK_CHANNELS.request) {
        // call local handler
        this.callLocalUriHandler(fromHostId, messageId, uri, payload)
      }
      else {
        // rise event with parsed message for responses
        this.incomeResponsesEvents.emit(
          channel,
          fromHostId,
          messageId,
          payload
        )
      }
    }
    else {
      if (ttl <= 0) {
        // TODO: или отправить ошибку обратно
        //       Тогда если ошибка о ttl тогда уже не посылать ошибку
        //       чтобы не было зацикливания
        // do noting on ttl 0
        return
      }
      // pass the message further
      this.sendMessage(
        channel,
        messageId,
        toHostId,
        payload,
        uri,
        fromHostId,
        ttl - 1
      )
        .catch((e: Error) => {
          // TODO: вместо записи в лог надо отправить назад ошибку,
          //       но как-то связать ее с этим сообщением
          this.log.error(e)
        })
    }
  }

  private callLocalUriHandler(
    fromHostId: string,
    messageId: string,
    uri: string,
    payload: Uint8Array
  ) {
    if (!this.uriHandlers[uri]) {
      this.sendErrorBack(fromHostId, messageId, NETWORK_ERROR_CODE.noHandler)

      return
    }

    const handlerData = uint8ArrToJson(payload)

    callSafely(() => this.uriHandlers[uri](handlerData, fromHostId))
      .then((result: JsonTypes | Uint8Array) => {
        this.sendMessage(
          NETWORK_CHANNELS.successResponse,
          messageId,
          fromHostId,
          jsonToUint8Arr(result),
          uri,
        )
          .catch((e: Error) => {
            this.log.error(
              `Error sending success response back: ` +
              `to host "${fromHostId}", uri "${uri}", messageId "${messageId}"` +
              `. "${e}"`
            )
          })
      })
      .catch((e: Error) => {
        this.sendErrorBack(
          fromHostId,
          messageId,
          NETWORK_ERROR_CODE.handlerError,
          String(e)
        )
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
    fromHostId?: string,
    ttl?: number
  ): Promise<void> {
    const connectionId = this.hostResolver.resolveConnection(toHostId)
    const completePayload = encodeNetworkMessage(
      (fromHostId) ? fromHostId : this.config.hostId,
      toHostId,
      messageId,
      (ttl) ? ttl : this.config.config.defaultTtl,
      payload,
      uri
    )

    await this.bridgesManager.send(
      connectionId,
      channel,
      completePayload
    )
  }

  private waitForResponse(requestMessageId: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const handlerIndex = this.incomeResponsesEvents.addListener((
        channel: NETWORK_CHANNELS,
        fromHostId: string,
        incomeMessageId: string,
        payload: Uint8Array
      ) => {
        if (incomeMessageId !== requestMessageId) return

        this.incomeResponsesEvents.removeListener(handlerIndex)
        clearTimeout(timeout)

        if (channel === NETWORK_CHANNELS.successResponse) {
          resolve(payload)
        }
        else {
          const [errorCode, message] = decodeErrorPayload(payload)

          // TODO: добавить message для noRoute и noHandler

          reject(
            `Error "${errorCode}"${(message) ? ': ' + message : ''}`
          )
        }
      })

      const timeout = setTimeout(() =>  {
        this.incomeResponsesEvents.removeListener(handlerIndex)
        reject(`Timeout has been exceeded`)
      }, this.config.config.responseTimoutSec)
    })
  }

}
