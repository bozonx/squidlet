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

    console.log(222, connectionId, request)

    // if (request.method !== 'get') {
    //   return {
    //     status: 405
    //   }
    // }
    // else if (request.url === '/assets/squidletUi.js') {
    //   return {
    //     status: 200,
    //     headers: {
    //       'content-type': 'text/javascript',
    //     } as any,
    //     body: '',
    //   }
    // }
    //
    // const parsedUrl = parseUrl(request.url)
    // const appName = parsedUrl.search?.app as string | undefined
    //
    // if (!appName) {
    //   return {
    //     status: 404,
    //     body: `Application hasn't set`
    //   }
    // }
    //
    // // TODO: add images
    // if ((parsedUrl.path || '').match(/\.(js|css)$/i)) {
    //   return this.makeStaticFileResponse(appName, parsedUrl.path!)
    // }
    //
    // return this.makeMainHtmlResp(appName)
  }

}
