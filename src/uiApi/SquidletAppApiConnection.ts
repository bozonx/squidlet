import {
  serializeJson,
  deserializeJson,
  IndexedEvents,
  Promised
} from 'squidlet-lib'
import type {UiApiRequestData} from '../services/UiWsApiService/UiWsApiService.js'
import {makeRequestId} from '../helpers/helpers.js'
import {DEFAULT_UI_WS_PORT} from '../types/constants.js'
import type {ResponseMessage, RequestMessage} from '../types/Message.js'
import type {AppBase} from '../base/AppBase.js'
import {CTX_SUB_ITEMS} from '../system/context/AppContext.js'
import {NOT_ALLOWED_APP_PROPS} from '../base/AppBase.js'

// it needs to export the port
export const APP_API_WS_PORT = DEFAULT_UI_WS_PORT


// TODO: таймаут ожидания и реконнект


export function squidletAppWrapper<YourApp = AppBase>(handleCall: (path: string, args: any[]) => any): YourApp {
  const handler: ProxyHandler<AppBase> = {
    get(target: any, prop: string) {
      if (prop === 'ctx') {
        return new Proxy({} as any, { get(target: any, ctxProp: string) {
          //if (NOT_ALLOWED_CTX_PROPS.includes(prop)) return
          if (CTX_SUB_ITEMS.includes(ctxProp)) {
            return new Proxy({} as any, { get(target: any, ctxPropParam: string) {
              return function (...a: any[]) {
                return handleCall(`${prop}.${ctxProp}.${ctxPropParam}`, a)
              }
            }})
          }
        }})
      }
      else if (NOT_ALLOWED_APP_PROPS.includes(prop)) return
      // user defined props
      return (...a: any[]) => handleCall(prop, a)
    },
  }

  return new Proxy({} as any, handler)
}



export class SquidletAppApiConnection<YourApp = AppBase> {
  incomeMessages = new IndexedEvents()
  socket: WebSocket
  app: YourApp
  errorHandler: (response: ResponseMessage) => void
  private _startedPromised = new Promised<void>()

  get startedPromise(): Promise<void> {
    return this._startedPromised.promise
  }


  constructor(
    appName: string,
    wsHost: string,
    wsPort: string,
    WsClass: new (url: string, protocol: string) => WebSocket,
    isSecure: boolean = false,
    errorHandler: (response: ResponseMessage) => void
  ) {
    this.errorHandler = errorHandler
    this.app = squidletAppWrapper<YourApp>(this.handleAppMethod)
    const url = `${(isSecure) ? 'wss' : 'ws'}://${wsHost}:${wsPort}/${appName}`
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

  // TODO: review RequestMessage
  async send(msgObj: Omit<RequestMessage<UiApiRequestData>, 'requestId' | 'url'>): Promise<ResponseMessage> {
    await this.startedPromise

    const request: Omit<RequestMessage<UiApiRequestData>, 'url'> = {
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

  private handleAppMethod = async (path: string, args: any[]) => {
    const resp = await this.send({
      data: {
        method: path,
        arguments: args,
      },
    })

    this.errorHandler(resp)

    return resp
  }

}
