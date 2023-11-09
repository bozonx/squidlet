import {Promised, IndexedEventEmitter} from 'squidlet-lib'
import type {DriverIndex} from '../../types/types.js'
import type {DriverContext} from '../../system/context/DriverContext.js'
import DriverFactoryBase from '../../base/DriverFactoryBase.js'
import {IO_NAMES} from '../../types/constants.js'
import {WsServerEvent} from '../../types/io/WsServerIoType.js'
import type {
  WsServerConnectionParams,
  WsServerIoFullType,
  WsServerProps,
} from '../../types/io/WsServerIoType.js'
import DriverInstanceBase from '../../base/DriverInstanceBase.js'


// TODO: а оно надо??? может лучше сессию использовать?
export const SETCOOKIE_LABEL = '__SET_COOKIE__';


export const WsServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new WsServerDriver(ctx)
}

// TODO: наверное прикрутить сессию чтобы считать что клиент ещё подключен
// TODO: отслежитьвать статус соединения - connected, wait, reconnect ...
// TODO: что если сервер сам неожиданно отвалился


export class WsServerInstance extends DriverInstanceBase<
  WsServerProps
> {
  private readonly events = new IndexedEventEmitter<(...args: any[]) => void>()
  // TODO: why not undefined?
  private serverId: string = ''
  private _startedPromised = new Promised<void>()

  // it fulfils when server is start listening
  get startedPromise(): Promise<void> {
    return this._startedPromised.promise;
  }

  private get wsServerIo(): WsServerIoFullType {
    return this.ctx.io.getIo<WsServerIoFullType>(IO_NAMES.WsServerIo)
  }

  // private get closedMsg() {
  //   return `Ws server "${this.props.host}:${this.props.port}" has been already closed, you can't manipulate it any more!`;
  // }


  async init() {
    this.ctx.log.info(`... Starting ws server: ${this.props.host}:${this.props.port}`)

    this.serverId = await this.wsServerIo.newServer(this.props)
  }

  async destroy() {
    // TODO: review
    if (!this.isInitialized()) {
      return this.ctx.log.error(`WsServerLogic.destroy: Server hasn't been initialized yet.`)
    }

    this.ctx.log.debug(`... destroying websocket server: ${this.props.host}:${this.props.port}`)
    this.events.destroy()

    // TODO: review
    //await this.removeListeners()
    // TODO: use destroyServer - it removes all the events before destroy
    // TODO: не должно поднять события
    await this.wsServerIo.closeServer(this.serverId)

    this.serverId = ''
  }


  isInitialized(): boolean {
    return Boolean(this.serverId)
  }

  async closeServer(force?: boolean) {
    if (!this.serverId) return

    // TODO: use force
    // TODO: должно при этом подняться событие close
    await this.wsServerIo.closeServer(this.serverId)

    this.serverId = ''
  }

  /**
   * Send message to client
   */
  send = (connectionId: string, data: Uint8Array): Promise<void> => {
    this.ctx.log.debug(`WsServerLogic.send from ${this.props.host}:${this.props.port} to connection ${connectionId}, data length ${data.length}`)

    return this.wsServerIo.send(this.serverId, connectionId, data)
  }

  // TODO: оно нужно ???
  // async setCookie(connectionId: string, cookie: string) {
  //   const data = `${SETCOOKIE_LABEL}${cookie}`;
  //
  //   this.ctx.log.debug(`WsServerLogic.setCookie from ${this.props.host}:${this.props.port} to connection ${connectionId}, ${data}`);
  //
  //   return this.wsServerIo.send(this.serverId, connectionId, data);
  // }

  /**
   * Force closing a connection.
   * Close event will be risen
   */
  closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
    this.ctx.log.debug(`WsServerLogic server ${this.props.host}:${this.props.port} manually closes connection ${connectionId}`)
    // TODO: проверить будет ли поднято событие close ???
    return this.wsServerIo.closeConnection(this.serverId, connectionId, code, reason)
  }

  async destroyConnection(connectionId: string) {
    this.ctx.log.debug(`WsServerLogic server ${this.props.host}:${this.props.port} destroys connection ${connectionId}`);
    // TODO: может проще тут отписаться от события и выполнить просто close
    // return this.wsServerIo.closeConnection(
    //   this.serverId,
    //   connectionId,
    //   WsCloseStatus.closeGoingAway,
    //   'Destroy connection'
    // )
    await this.wsServerIo.destroyConnection(this.serverId, connectionId)
  }

  // async start() {
  //   // TODO: WTF ???
  // }
  //
  // async stop(force?: boolean) {
  //   if (!this.logic) throw new Error(`WsServer.stop: ${this.onRequest}`)
  //
  //   return this.logic.closeServer(force)
  // }


  /**
   * Listen income messages
   */
  onMessage(cb: (connectionId: string, data: Uint8Array) => void): number {
    return this.events.addListener(WsServerEvent.connectionMessage, cb)
  }

  /**
   * It rises when new connection is come.
   */
  onConnection(cb: (connectionId: string, request: WsServerConnectionParams) => void): number {
    return this.events.addListener(WsServerEvent.newConnection, cb);
  }

  /**
   * Listen any connection close
   */
  onConnectionClose(cb: (connectionId: string) => void): number {
    return this.events.addListener(WsServerEvent.connectionClose, cb);
  }

  onConnectionError(cb: (connectionId: string, err: string) => void): number {
    return this.events.addListener(WsServerEvent.connectionError, cb)
  }

  onServerError(cb: (err: string) => void): number {
    return this.events.addListener(WsServerEvent.serverError, cb)
  }

  // TODO: add other events
  /*
  serverStarted,
  serverClosed,
  */

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }


  handleServerListening() {
    this.ctx.log.debug(`WsServerLogic: server ${this.props.host}:${this.props.port} started listening`);
    this._startedPromised.resolve()
    this.events.emit(WsServerEvent.serverStarted)
  }

  handleServerClose() {
    //this.ctx.log.debug(`WsServerLogic: server ${this.props.host}:${this.props.port} has been closed`);
    this.ctx.log.log(`Ws server "${this.props.host}:${this.props.port}" has been already closed, you can't manipulate it any more!`);
    //await this.removeListeners();

    this.serverId = ''

    this.events.destroy();
  }

  handleServerError(err: string) {
    this.ctx.log.error(`Error on ws server ${this.props.host}:${this.props.port}. ${err}`)
    this.events.emit(WsServerEvent.serverError, err)
  }

  handleNewConnection(connectionId: string, params: WsServerConnectionParams) {
    this.ctx.log.debug(`WsServerLogic: server ${this.props.host}:${this.props.port} received a new connection ${connectionId}, ${JSON.stringify(params)}`)
    this.events.emit(WsServerEvent.newConnection, connectionId, params)
  }

  handleConnectionClose(serverId: string, connectionId: string, code?: number, reason?: string) {
    this.ctx.log.debug(`WsServerLogic connection ${connectionId} has been closed on server ${this.props.host}:${this.props.port} has been closed. Code ${code}. Reason: ${reason || ''}`);
    this.events.emit(WsServerEvent.connectionClose, connectionId)
  }

  handleIncomeMessage(connectionId: string, data: Uint8Array) {
    this.ctx.log.debug(`WsServerLogic income message on server ${this.props.host}:${this.props.port}, connection id ${connectionId}, data length ${data.length}`);
    this.events.emit(WsServerEvent.connectionMessage, connectionId, data)
  }

  handleConnectionUnexpectedResponse(connectionId: string, params: WsServerConnectionParams) {
    this.ctx.log.error(`Unexpected response on ws server ${this.props.host}:${this.props.port} connection ${connectionId}. ${JSON.stringify(params)}`)
    this.events.emit(WsServerEvent.connectionUnexpectedResponse, connectionId, params)
  }

  handleConnectionError(connectionId: string, err: string) {
    this.ctx.log.error(`Error on ws server ${this.props.host}:${this.props.port} connection ${connectionId}. ${err}`)
    this.events.emit(WsServerEvent.connectionError, connectionId, err)
  }

}

export class WsServerDriver extends DriverFactoryBase<WsServerInstance, WsServerProps> {
  protected SubDriverClass = WsServerInstance

  async init(cfg?: Record<string, any>) {
    await super.init(cfg)

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
        instance.handleServerClose()
      }
      else if (eventName === WsServerEvent.serverStarted) {
        //clearTimeout(listeningTimeout)
        instance.handleServerListening()
      }
      else if (eventName === WsServerEvent.serverError) {
        instance.handleServerError(p[0])
      }
      else if (eventName === WsServerEvent.newConnection) {
        instance.handleNewConnection(p[0], p[1])
      }
      // Connection
      else if (eventName === WsServerEvent.connectionClose) {
        instance.handleConnectionClose(p[0], p[1], p[2])
      }
      else if (eventName === WsServerEvent.connectionMessage) {
        instance.handleIncomeMessage(p[0], p[1])
      }
      else if (eventName === WsServerEvent.connectionError) {
        instance.handleConnectionError(p[0], p[1])
      }
      else if (eventName === WsServerEvent.connectionUnexpectedResponse) {
        instance.handleConnectionUnexpectedResponse(p[0], p[1])
      }
    })
  }

  protected makeInstanceId(props: WsServerProps, cfg?: Record<string, any>): string {
    return `${props.host}:${props.port}`;
  }
}
