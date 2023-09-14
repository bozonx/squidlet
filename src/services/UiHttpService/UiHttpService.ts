import {parseUrl} from 'squidlet-lib'
import {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {HttpServerDriver, HttpServerInstance} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {DEFAULT_UI_HTTP_PORT, DRIVER_NAMES} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'
import {ServiceProps} from '../../types/ServiceProps.js'
import {HttpDriverRequest, HttpDriverResponse} from '../../drivers/HttpServerDriver/HttpServerLogic.js'
import {uiHtml} from './uiHtmlTmpl.js'


export const UiHttpServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new UiHttpService(ctx)
}

export interface UiHttpServiceCfg extends HttpServerProps {
}

export const DEFAULT_UI_HTTP_SERVICE_CFG = {
  host: 'localhost',
  port: DEFAULT_UI_HTTP_PORT,
}


export class UiHttpService extends ServiceBase {
  private httpServer!: HttpServerInstance
  private cfg!: UiHttpServiceCfg


  props: ServiceProps = {
    requireDriver: [DRIVER_NAMES.HttpServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: UiHttpServiceCfg) {
    super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_UI_HTTP_SERVICE_CFG

    // TODO: если конфина нет то по умолчанию

    this.httpServer = await this.ctx.drivers
      .getDriver<HttpServerDriver>(DRIVER_NAMES.HttpServerDriver)
      .subDriver({
        host: this.cfg.host,
        port: this.cfg.port,
      } as HttpServerProps)

    this.httpServer.onRequest(async (request: HttpDriverRequest): Promise<HttpDriverResponse> => {
      if (request.method !== 'get') {
        return {
          status: 405
        }
      }
      else if (request.url === '/assets/squidletUi.js') {
        return {
          status: 200,
          headers: {
            'content-type': 'text/javascript',
          } as any,
          body: '',
        }
      }

      // TODO: подставить в него нужные имена файлов
      // TODO: отдать /assets/squidletUi.js
      // TODO: зарезолвить роут чтобы определить какое приложение нужно загружать

      const parsedUrl = parseUrl(request.url)
      /*
      url: '/?app=aaa',
      // { path: '/', search: { app: 'aaa' } }
       */

      if ((parsedUrl.path || '').match(/\.js$/)) {
        // TODO: загрузить js файл приложения
      }
      else if ((parsedUrl.path || '').match(/\.css$/)) {
        // TODO: загрузить css файл приложения
      }

      const body = uiHtml('', '', 'Hello!!!')

      return {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        } as any,
        body
      }
    })
  }

  async destroy() {
  }

  async start() {

    // TODO: WTF ???!!!

    await this.httpServer.start()
  }

  async stop(force?: boolean) {
    await this.httpServer.stop(force)
  }

}
