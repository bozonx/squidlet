// TODO: должен запустить ws сервер на localhost чтобы обмениваться данными
//       c специальным фронтенд клиентом - это не универсальный api сервис



// TODO: remove
// async init() {
//   this.events.addListener((...d: any[]) => {
//     console.log(1111, d)
//   })
//
//   const srverId = await this.newServer({
//     host: 'localhost',
//     port: 42181
//   })
//
// }


import {
  parseUrl,
  pathJoin,
  getExt,
  trimCharStart,
  HTTP_CONTENT_TYPES,
  HTTP_FILE_EXT_CONTENT_TYPE
} from 'squidlet-lib'
import {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {HttpServerDriver, HttpServerInstance} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {
  APP_FILES_PUBLIC_DIR,
  DEFAULT_UI_HTTP_PORT,
  DEFAULT_UI_WS_PORT,
  DRIVER_NAMES,
  ROOT_DIRS,
} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'
import {ServiceProps} from '../../types/ServiceProps.js'
import {HttpDriverRequest, HttpDriverResponse} from '../../drivers/HttpServerDriver/HttpServerDriverLogic.js'
import {uiHtml} from './uiHtmlTmpl.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {WsServerProps} from '../../types/io/WsServerIoType.js'


// TODO: можно добавить специальный кукис сессии чтобы проверять откуда сделан запрос


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
      } as HttpServerProps)

    this.wsServer.onRequest(
      (request: HttpDriverRequest) => this.handleRequest(request)
    )
  }

  async destroy() {
  }

  async start() {

    // TODO: WTF ???!!!

    await this.wsServer.start()
  }

  async stop(force?: boolean) {
    await this.wsServer.stop(force)
  }


  private async handleRequest(request: WsDriverRequest): Promise<WsDriverResponse> {
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
