import type {
  HttpRequest,
} from 'squidlet-lib'
import type {DriverContext} from '../../system/context/DriverContext.js'
import type {DriverIndex} from '../../types/types.js'
import DriverFactoryBase from '../../base/DriverFactoryBase.js'
import DriverInstanceBase from '../../base/DriverInstanceBase.js'
import {IO_NAMES} from '../../types/constants.js'
import {
  HttpServerEvent,
} from '../../types/io/HttpServerIoType.js'
import type {
  HttpServerIoFullType,
  HttpServerIoType,
  HttpServerProps,
} from '../../types/io/HttpServerIoType.js'
import HttpServerDriverLogic from './HttpServerDriverLogic.js'
import type {HttpDriverRequest, HttpDriverResponse} from './HttpServerDriverLogic.js'
import {IoBase} from '../../base/IoBase.js'


export const HttpServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpServerDriver(ctx)
}

export class HttpServerInstance extends DriverInstanceBase<
  HttpServerProps
> {
  logic!: HttpServerDriverLogic

  private get httpServerIo(): HttpServerIoFullType {
    return this.ctx.io.getIo<HttpServerIoFullType>(IO_NAMES.HttpServerIo)
  }

  private get closedMsg() {
    return `Http server "${this.props.host}:${this.props.port}" has been already closed`;
  }

  // it fulfils when server is start listening
  get startedPromise(): Promise<void> {
    if (!this.logic) {
      throw new Error(`HttpServer.startedPromise: ${this.closedMsg}`);
    }

    return this.logic.startedPromise;
  }


  async init() {
    this.logic = new HttpServerDriverLogic(
      this.httpServerIo,
      this.props,
      () => {
        this.ctx.log.error(`HttpServer: ${this.closedMsg}, you can't manipulate it any more!`);
      },
      this.ctx.log.debug,
      this.ctx.log.info,
      this.ctx.log.error
    )

    await this.logic.init()
  }

  async destroy() {
    await this.logic.destroy()
  }


  async start() {
    // TODO: WTF ???
  }

  async stop(force?: boolean) {
    if (!this.logic) throw new Error(`HttpServer.stop: ${this.onRequest}`)

    return this.logic.closeServer(force)
  }


  onRequest(cb: (request: HttpDriverRequest) => Promise<HttpDriverResponse>): number {
    if (!this.logic) throw new Error(`HttpServer.onMessage: ${this.onRequest}`);

    return this.logic.onRequest(cb)
  }

  removeRequestListener(handlerIndex: number) {
    if (!this.logic) throw new Error(`HttpServer.removeRequestListener: ${this.onRequest}`);

    this.logic.removeRequestListener(handlerIndex)
  }

  // handleServerListening() {
  //   this.logic.handleServerListening()
  // }
  //
  // handleServerClose() {
  //   this.logic.handleServerClose()
  // }
  //
  // handleServerError(err: string) {
  //   this.logic.handleServerError(err)
  // }
  //
  // handleServerRequest(requestId: number, request: HttpRequest) {
  //   this.logic.handleServerRequest(requestId, request)
  // }

}

export class HttpServerDriver extends DriverFactoryBase<HttpServerInstance, HttpServerProps> {
  protected SubDriverClass = HttpServerInstance

  async init(cfg?: Record<string, any>) {
    await super.init(cfg)

    const httpServerIo = this.ctx.io
      .getIo<HttpServerIoFullType>(IO_NAMES.HttpServerIo)

    // TODO: лучше чтобы драйвер слушал один раз и раздовал по серверам

    await httpServerIo.on((eventName: HttpServerEvent, serverId: string, ...p: any[]) => {
      // serverId is host:port
      const instance = this.instances[serverId]

      if (!instance) {
        this.ctx.log.warn(`Can't find instance of HTTP server "${serverId}"`)

        return
      }

      if (eventName === HttpServerEvent.serverClose) {
        //clearTimeout(listeningTimeout)
        instance.logic.handleServerClose()
      }
      else if (eventName === HttpServerEvent.listening) {
        //clearTimeout(listeningTimeout)
        instance.logic.handleServerListening()
      }
      else if (eventName === HttpServerEvent.serverError) {
        instance.logic.handleServerError(p[0])
      }
      else if (eventName === HttpServerEvent.request) {
        instance.logic.handleServerRequest(p[0], p[1])
      }
    })
  }

  protected makeInstanceId(props: HttpServerProps, cfg?: Record<string, any>): string {
    return `${props.host}:${props.port}`;
  }
}
