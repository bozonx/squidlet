import {serializeJson, deserializeJson, getDeepMethod} from 'squidlet-lib'
import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {
  DEFAULT_UI_WS_PORT,
  DRIVER_NAMES,
} from '../../types/contstants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {WsServerConnectionParams, WsServerProps} from '../../types/io/WsServerIoType.js'
import type {WsServerDriver, WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'
import {requestError} from '../../system/helpers/helpers.js'
import type {RequestError} from '../../system/helpers/helpers.js'


export interface UiApiIncomeMessage {
  // session of a app tab
  sessionId: string
  // generate it on client to have a certain request
  requestId: string
  // api method to call can be with "." separator
  method: string
  // arguments for the method
  arguments: any[]
}

export interface UiApiResponse {
  requestId: string
  data?: any
  errorStatus?: number
  errorMessage?: string
}


export const UiWsApiServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new UiWsApiService(ctx)
}

export interface UiWsApiServiceCfg extends WsServerProps {
}

export const DEFAULT_UI_WS_SERVICE_CFG = {
  host: 'localhost',
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
    super.init(onFall)

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
        const errResp: UiApiResponse = {
          requestId: msgObj.requestId,
          errorStatus: err.code,
          errorMessage: err.message,
        }

        this.ctx.log.debug(`UiWsApiService ERROR response ${JSON.stringify(errResp)}`)

        await this.wsServer.send(connectionId, serializeJson(errResp))

        return
      }

      const resp: UiApiResponse = {
        requestId: msgObj.requestId,
        data: resultData,
      }

      this.ctx.log.debug(`UiWsApiService response ${JSON.stringify(resp)}`)

      // send response
      await this.wsServer.send(connectionId, serializeJson(resp))
    })()
      .catch((er: string) => this.ctx.log.error(er))
  }

  private async processMessage(msgObj: UiApiIncomeMessage): Promise<any> {
    // TODO: resolve sessionId
    // TODO: взять имя приложение из сессии
    const appName = 'Publisher'
    const app = this.ctx.apps.getApp(appName)

    if (!app) throw requestError(500, `Can't find an app "${appName}"`)

    const method = getDeepMethod(app, msgObj.method)

    if (!method) throw requestError(500, `Can't find a method "${msgObj.method}" of an app "${appName}"`)

    let result: any

    try {
      result = await method(...msgObj.arguments)
    }
    catch (e) {
      throw requestError(500, `Error calling method "${msgObj.method}" of an app "${appName}": ${e}`)
    }

    return result
  }
}
