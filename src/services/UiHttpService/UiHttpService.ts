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
import {APP_FILES_PUBLIC_DIR, DEFAULT_UI_HTTP_PORT, DRIVER_NAMES, ROOT_DIRS} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'
import {ServiceProps} from '../../types/ServiceProps.js'
import {HttpDriverRequest, HttpDriverResponse} from '../../drivers/HttpServerDriver/HttpServerDriverLogic.js'
import {uiHtml} from './uiHtmlTmpl.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


// TODO: можно добавить специальный кукис сессии чтобы проверять откуда сделан запрос


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

  get fileDriver(): FilesDriver {
    return this.ctx.drivers.getDriver(DRIVER_NAMES.FilesDriver)
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

    this.httpServer.onRequest(
      (request: HttpDriverRequest) => this.handleRequest(request)
    )
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


  private async handleRequest(request: HttpDriverRequest): Promise<HttpDriverResponse> {
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

    const parsedUrl = parseUrl(request.url)
    const appName = parsedUrl.search?.app as string | undefined

    if (!appName) {
      return {
        status: 404,
        body: `Application hasn't set`
      }
    }

    // TODO: add images
    if ((parsedUrl.path || '').match(/\.(js|css)$/i)) {
      return this.makeStaticFileResponse(appName, parsedUrl.path!)
    }

    return this.makeMainHtmlResp(appName)
  }

  private async makeStaticFileResponse(appName: string, reqPath: string): Promise<HttpDriverResponse> {
    const staticFiles = this.ctx.getAppUiStaticFiles(appName) || []
    const found = staticFiles.find((item) => reqPath)

    if (!found) {
      return {
        status: 404,
      }
    }

    const ext = getExt(reqPath)
    const contentType = HTTP_FILE_EXT_CONTENT_TYPE[ext as keyof typeof HTTP_FILE_EXT_CONTENT_TYPE]

    if (!contentType) {
      return {
        // unsupported media type
        status: 415
      }
    }

    // TODO: как отдавать картинки???
    const filePath = pathJoin(
      '/',
      ROOT_DIRS.appFiles,
      APP_FILES_PUBLIC_DIR,
      trimCharStart(reqPath, '/')
    )
    let fileContent

    try {
      fileContent = await this.fileDriver.readTextFile(filePath)
    }
    catch (e) {
      return {
        status: 404,
      }
    }

    return {
      status: 200,
      headers: {
        'content-type': contentType,
      },
      // TODO: add content type
      body: fileContent
    }
  }

  private async makeMainHtmlResp(appName: string): Promise<HttpDriverResponse> {
    const staticFiles = this.ctx.getAppUiStaticFiles(appName) || []
    const jsFilesStr = staticFiles
      .filter((item) => item.match(/\.js$/i))
      .map((item) => `<script src="${item}"></script>`)
      .join(`\n`)
    let cssFilesStr = staticFiles
      .filter((item) => item.match(/\.css$/i))
      .map((item) => `<style rel="${item}"></style>`)
      .join(`\n`)
    let errMsg: string | undefined

    // TODO: check in other way
    if (!this.ctx.getAppUiStaticFiles(appName)) {
      errMsg = `Can't find app`
    }

    const body = uiHtml(jsFilesStr, cssFilesStr, errMsg)

    return {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      } as any,
      body
    }
  }

}
