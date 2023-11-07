import {
  serializeJson,
  deserializeJson,
  IndexedEvents,
  Promised
} from 'squidlet-lib'
import type {UiApiRequestData} from '../services/UiWsApiService/UiWsApiService.js'
import {makeRequestId} from '../system/helpers/helpers.js'
import {DEFAULT_UI_WS_PORT} from '../types/contstants.js'
import type {ResponseMessage, RequestMessage} from '../types/Message.js'

// it needs to export the port
export const APP_API_WS_PORT = DEFAULT_UI_WS_PORT


//const PROTOCOL = 'squidlet-app-api'
//
// /**
//  * this is api which is used in frontend to connect to backend api
//  */
//
// const WsClass: new (url: string, protocol: string) => WebSocket = WebSocket
// // @ts-ignore
// const wsHost = window.SQUIDLET_API_HOST || DEFAULT_UI_HTTP_PORT
// // @ts-ignore
// const wsPort = window.SQUIDLET_API_PORT || DEFAULT_UI_WS_PORT
//
// // @ts-ignore
// window.squidletUiApi =
//   new UiApiMain(wsHost, wsPort, WsClass)


// TODO: перенести в squidlet
// TODO: таймаут ожидания и реконнект


export class SquidletAppApiConnection {
  incomeMessages = new IndexedEvents()
  socket: WebSocket

  private _startedPromised = new Promised<void>()

  get startedPromise(): Promise<void> {
    return this._startedPromised.promise
  }


  constructor(
    wsHost: string,
    wsPort: string,
    WsClass: new (url: string, protocol: string) => WebSocket,
    isSecure: boolean = false
  ) {
    const url = `${(isSecure) ? 'wss' : 'ws'}://${wsHost}:${wsPort}`
    this.socket = new WsClass(url, '0')

    this.socket.onmessage = this.handleWebsocketMessage
    this.socket.onclose = this.handleWebsocketClose

    this.socket.addEventListener("open", (event) => {
      this._startedPromised.resolve()
    })
  }





  // async start() {
  //   await this.startedPromise
  //
  //   await this.send({
  //     test: 1,
  //     str: 'str222',
  //     ru: 'русский',
  //     obj: {a: 1},
  //   })
  // }

  async send(msgObj: Omit<RequestMessage<UiApiRequestData>, 'requestId'>): Promise<ResponseMessage> {
    await this.startedPromise

    const request: RequestMessage<UiApiRequestData> = {
      requestId: makeRequestId(),
      ...msgObj,
    }

    this.socket.send(serializeJson(request))

    const promised = new Promised()

    // TODO: добавить таймаут ожидания
    // TODO: проверить ошибку
    const handlerIndex = this.incomeMessages.addListener((data: any) => {
      if (data.requestId !== request.requestId) return

      this.incomeMessages.removeListener(handlerIndex)
      promised.resolve(data)
    })

    return promised.promise
  }

  private handleWebsocketMessage = (message: MessageEvent) => {
    (async () => {
      const arrBuf = new Uint8Array(await message.data.arrayBuffer(8))

      this.incomeMessages.emit(deserializeJson(arrBuf))
    })()
      .catch((er: string) => console.error(er))
  }

  private handleWebsocketClose = () => {
    console.warn(`WS connection closed`)

    // TODO: reconnect
  }

}
