import {serializeJson, deserializeJson} from 'squidlet-lib'
import {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {
  DEFAULT_UI_WS_PORT,
  DRIVER_NAMES,
} from '../../types/contstants.js'
import {ServiceProps} from '../../types/ServiceProps.js'
import {WsServerConnectionParams, WsServerProps} from '../../types/io/WsServerIoType.js'
import {WsServerDriver, WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'


// TODO: можно добавить специальный кукис сессии чтобы проверять откуда сделан запрос
// TODO: должен запустить ws сервер на localhost чтобы обмениваться данными
//       c специальным фронтенд клиентом - это не универсальный api сервис



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

  // get fileDriver(): FilesDriver {
  //   return this.ctx.drivers.getDriver(DRIVER_NAMES.FilesDriver)
  // }


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
    const msgObj = deserializeJson(data)

    console.log(333, connectionId, msgObj)

    this.wsServer.send(connectionId, serializeJson({tt: 'resp'}))
      .catch((er: string) => this.ctx.log.error(er))
  }

}
