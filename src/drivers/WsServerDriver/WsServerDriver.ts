import {DriverIndex} from '../../types/types.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import DriverFactoryBase from '../../system/driver/DriverFactoryBase.js'
import {IO_NAMES} from '../../types/contstants.js'
import {WsServerEvent, WsServerIoFullType, WsServerProps} from '../../types/io/WsServerIoType.js'
import DriverInstanceBase from '../../system/driver/DriverInstanceBase.js'
import WsServerDriverLogic from './WsServerDriverLogic.js'


export const WsServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new WsServerDriver(ctx)
}

export class WsServerInstance extends DriverInstanceBase<
  WsServerProps
> {
  logic!: WsServerDriverLogic

  private get wsServerIo(): WsServerIoFullType {
    return this.ctx.io.getIo<WsServerIoFullType>(IO_NAMES.WsServerIo)
  }

  private get closedMsg() {
    return `Ws srver "${this.props.host}:${this.props.port}" has been already closed`;
  }

  // it fulfils when server is start listening
  get startedPromise(): Promise<void> {
    if (!this.logic) {
      throw new Error(`WsServer.startedPromise: ${this.closedMsg}`);
    }

    return this.logic.startedPromise
  }


  async init() {
    this.logic = new WsServerDriverLogic(
      this.wsServerIo,
      this.props,
      () => {
        this.ctx.log.error(`WsServer: ${this.closedMsg}, you can't manipulate it any more!`);
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
    if (!this.logic) throw new Error(`WsServer.stop: ${this.onRequest}`)

    return this.logic.closeServer(force)
  }


  onRequest(cb: (request: WsDriverRequest) => Promise<WsDriverResponse>): number {
    if (!this.logic) throw new Error(`WsServer.onMessage: ${this.onRequest}`);

    return this.logic.onRequest(cb)
  }

  removeRequestListener(handlerIndex: number) {
    if (!this.logic) throw new Error(`WsServer.removeRequestListener: ${this.onRequest}`);

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

  // handleServerRequest(requestId: number, request: WsRequest) {
  //   this.logic.handleServerRequest(requestId, request)
  // }

}

export class WsServerDriver extends DriverFactoryBase<WsServerInstance, WsServerProps> {
  protected SubDriverClass = WsServerInstance

  async init(cfg?: Record<string, any>) {
    super.init(cfg)

    const wsServerIo = this.ctx.io
      .getIo<WsServerIoFullType>(IO_NAMES.WsServerIo)

    // TODO: лучше чтобы драйвер слушал один раз и раздовал по серверам
    // TODO: отслеживать статус соединения с io
    // TODO: отслеживать таймаут для поднятия сервера - если не получилось то повторить

    await wsServerIo.on((eventName: WsServerEvent, serverId: string, ...p: any[]) => {
      const instance = this.instances[serverId]

      if (!instance) {
        this.ctx.log.warn(`Can't find instance of Ws server "${serverId}"`)

        return
      }

      if (eventName === WsServerEvent.serverClosed) {
        //clearTimeout(listeningTimeout)
        instance.logic.handleServerClose()
      }
      else if (eventName === WsServerEvent.serverStarted) {
        //clearTimeout(listeningTimeout)
        instance.logic.handleServerListening()
      }
      else if (eventName === WsServerEvent.serverError) {
        instance.logic.handleServerError(p[0])
      }
      else if (eventName === WsServerEvent.newConnection) {
        instance.logic.handleNewConnection(p[0], p[1])
      }
      // else if (eventName === WsServerEvent.connectionClose) {
      //   instance.logic.handleConnectionClose(p[0], p[1])
      // }
      else if (eventName === WsServerEvent.incomeMessage) {
        instance.logic.handleIncomeMessage(p[0], p[1])
      }
      else if (eventName === WsServerEvent.connectionError) {
        instance.logic.handleConnectionError(p[0], p[1])
      }

      // TODO: ??? clientClose, ...
    })
  }

  protected makeInstanceId(props: WsServerProps, cfg?: Record<string, any>): string {
    return `${props.host}:${props.port}`;
  }
}
