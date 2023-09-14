import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import DriverFactoryBase from '../../system/driver/DriverFactoryBase.js'
import DriverInstanceBase from '../../system/driver/DriverInstanceBase.js'
import {IO_NAMES} from '../../types/contstants.js'
import {HttpServerEvent, HttpServerIoType, HttpServerProps} from '../../types/io/HttpServerIoType.js'
import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from './HttpServerLogic.js'
import {IoBase} from '../../system/Io/IoBase.js'


export const HttpServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpServerDriver(ctx)
}

export class HttpServerInstance extends DriverInstanceBase<
  HttpServerProps
> {
  private server!: HttpServerLogic

  private get httpServerIo(): HttpServerIoType & IoBase {
    return this.ctx.io.getIo<HttpServerIoType & IoBase>(IO_NAMES.HttpServerIo)
  }

  private get closedMsg() {
    return `Server "${this.props.host}:${this.props.port}" has been already closed`;
  }

  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    if (!this.server) {
      throw new Error(`HttpServer.listeningPromise: ${this.closedMsg}`);
    }

    return this.server.listeningPromise;
  }


  async init() {
    this.server = new HttpServerLogic(
      this.httpServerIo,
      this.props,
      () => {
        this.ctx.log.error(`HttpServer: ${this.closedMsg}, you can't manipulate it any more!`);
      },
      this.ctx.log.debug,
      this.ctx.log.info,
      this.ctx.log.error
    );

    await this.server.init();
  }

  async destroy() {
    await this.server.destroy();
  }


  async start() {
    // TODO: WTF ???
  }

  async stop(force?: boolean) {
    if (!this.server) throw new Error(`HttpServer.removeRequestListener: ${this.onRequest}`);

    return this.server.closeServer(force);
  }


  onRequest(cb: (request: HttpDriverRequest) => Promise<HttpDriverResponse>): number {
    if (!this.server) throw new Error(`HttpServer.onMessage: ${this.onRequest}`);

    return this.server.onRequest(cb)
  }

  removeRequestListener(handlerIndex: number) {
    if (!this.server) throw new Error(`HttpServer.removeRequestListener: ${this.onRequest}`);

    this.server.removeRequestListener(handlerIndex)
  }

  handleServerListening = this.server.handleServerListening
  handleServerClose = this.server.handleServerClose
  handleServerError = this.server.handleServerError
  handleServerRequest = this.server.handleServerRequest

}

export class HttpServerDriver extends DriverFactoryBase<HttpServerInstance, HttpServerProps> {
  protected SubDriverClass = HttpServerInstance

  async init(cfg?: Record<string, any>) {
    super.init(cfg)

    const httpServerIo = this.ctx.io
      .getIo<HttpServerIoType & IoBase>(IO_NAMES.HttpServerIo)

    // TODO: лучше чтобы драйвер слушал один раз и раздовал по серверам

    await httpServerIo.on((eventName: HttpServerEvent, serverId: string, ...p: any[]) => {
      const instance = this.instances[serverId]

      if (!instance) {
        this.ctx.log.warn(`Can't find instance of HTTP server "${serverId}"`)

        return
      }

      if (eventName === HttpServerEvent.serverClose) {
        //clearTimeout(listeningTimeout)
        instance.handleServerClose()
      }
      else if (eventName === HttpServerEvent.listening) {
        //clearTimeout(listeningTimeout)
        instance.handleServerListening()
      }
      else if (eventName === HttpServerEvent.serverError) {
        instance.handleServerError(p[0])
      }
      else if (eventName === HttpServerEvent.request) {
        instance.handleServerRequest(p[0], p[1])
      }
    })
  }

  protected instanceId = (props: HttpServerProps, cfg?: Record<string, any>): string => {
    return `${props.host}:${props.port}`;
  }
}
