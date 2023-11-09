import {serializeJson, deserializeJson, getDeepMethod} from 'squidlet-lib'
import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import {
  DEFAULT_UI_WS_PORT,
  DRIVER_NAMES, LOCAL_HOST,
} from '../../types/constants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {WsServerConnectionParams, WsServerProps} from '../../types/io/WsServerIoType.js'
import type {WsServerDriver, WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'
import {requestError} from '../../helpers/helpers.js'
import type {RequestError} from '../../helpers/helpers.js'
import type {RequestMessage, ResponseMessage} from '../../types/Message.js'


export interface UiApiRequestData {
  // api method to call can be with "." separator
  method: string
  // arguments for the method
  arguments: any[]
}

export const UiWsApiServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new UiWsApiService(ctx)
}

export interface UiWsApiServiceCfg extends WsServerProps {
}

export const DEFAULT_UI_WS_SERVICE_CFG = {
  host: LOCAL_HOST,
  port: DEFAULT_UI_WS_PORT,
}


export class UiWsApiService extends ServiceBase {
  private wsServer!: WsServerInstance
  private cfg!: UiWsApiServiceCfg


  props: ServiceProps = {
    requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: UiWsApiServiceCfg) {
    await super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_UI_WS_SERVICE_CFG

    // TODO: если конфина нет то по умолчанию

    this.wsServer = await this.ctx.drivers
      .getDriver<WsServerDriver>(DRIVER_NAMES.WsServerDriver)
      .subDriver({
        host: this.cfg.host,
        port: this.cfg.port,
      } as WsServerProps)

    this.wsServer.onConnection(this.handleConnection)
    this.wsServer.onMessage(this.handleMessage)
  }

  async destroy() {
  }

  async start() {

    // TODO: WTF ???!!!

    //await this.wsServer.start()
  }

  async stop(force?: boolean) {
    await this.wsServer.closeServer(force)
  }


  private handleConnection = (connectionId: string, request: WsServerConnectionParams) => {

    // TODO: подключиться к сессии вкладки и приложения

    //console.log(222, connectionId, request)
  }

  private handleMessage = (connectionId: string, data: Uint8Array) => {
    (async () => {
      const msgObj = deserializeJson(data)
      let resultData

      try {
        resultData = await this.processMessage(msgObj)
      }
      catch (e) {
        const err = e as RequestError
        const errResp: ResponseMessage = {
          requestId: msgObj.requestId,
          errorStatus: err.code,
          errorMessage: err.message,
        }

        this.ctx.log.debug(`UiWsApiService ERROR response ${JSON.stringify(errResp)}`)

        await this.wsServer.send(connectionId, serializeJson(errResp))

        return
      }

      const resp: ResponseMessage = {
        requestId: msgObj.requestId,
        data: resultData,
      }

      this.ctx.log.debug(`UiWsApiService response ${JSON.stringify(resp)}`)

      // send response
      await this.wsServer.send(connectionId, serializeJson(resp))
    })()
      .catch((er: string) => this.ctx.log.error(er))
  }

  private async processMessage(msgObj: RequestMessage<UiApiRequestData>): Promise<any> {
    // TODO: обработать url
    // TODO: resolve sessionId
    // TODO: взять имя приложение из сессии
    const appName = 'Publisher'
    const app = this.ctx.apps.getApp(appName)

    if (!app) throw requestError(500, `Can't find an app "${appName}"`)

    const method = getDeepMethod(app, msgObj.data!.method)

    if (!method) throw requestError(500, `Can't find a method "${msgObj.data!.method}" of an app "${appName}"`)

    let result: any

    try {
      result = await method(...msgObj.data!.arguments)
    }
    catch (e) {
      throw requestError(500, `Error calling method "${msgObj.data!.method}" of an app "${appName}": ${e}`)
    }

    return result
  }
}
