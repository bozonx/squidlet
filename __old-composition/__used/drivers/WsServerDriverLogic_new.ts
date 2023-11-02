import {Promised, IndexedEventEmitter} from 'squidlet-lib'
import {
  WsServerConnectionParams,
  WsServerEvent,
  WsServerIoFullType,
  WsServerProps,
} from '../../../src/types/io/WsServerIoType'


// TODO: а оно надо??? может лучше сессию использовать?
export const SETCOOKIE_LABEL = '__SET_COOKIE__';


// TODO: наверное прикрутить сессию чтобы считать что клиент ещё подключен
// TODO: отслежитьвать статус соединения - connected, wait, reconnect ...


export default class WsServerDriverLogic_new {
  // it fulfils when server is start listening
  get startedPromise(): Promise<void> {
    return this._startedPromised.promise;
  }

  private readonly events = new IndexedEventEmitter<(...args: any[]) => void>()
  private readonly wsServerIo: WsServerIoFullType
  private readonly props: WsServerProps;
  private readonly onClose: () => void;
  private readonly logDebug: (message: string) => void
  private readonly logInfo: (message: string) => void
  private readonly logError: (message: string) => void

  // TODO: why not undefined?
  private serverId: string = ''
  private _startedPromised: Promised<void>

  // TODO: review
  private handlerIndexes: [WsServerEvent, number][] = []


  constructor(
    wsServerIo: WsServerIoFullType,
    props: WsServerProps,
    // TODO: должен сам перезапускать сервер
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logDebug: (message: string) => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo
    this.props = props
    this.onClose = onClose
    this.logDebug = logDebug
    this.logInfo = logInfo
    this.logError = logError
    this._startedPromised = new Promised<void>()
  }


  /**
   * Start server
   */
  async init() {
    this.logInfo(`... Starting ws server: ${this.props.host}:${this.props.port}`)

    this.serverId = await this.wsServerIo.newServer(this.props)
  }

  async destroy() {
    // TODO: review
    if (!this.isInitialized()) {
      return this.logError(`WsServerLogic.destroy: Server hasn't been initialized yet.`)
    }

    this.logDebug(`... destroying websocket server: ${this.props.host}:${this.props.port}`)
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
  send = (connectionId: string, data: string | Uint8Array): Promise<void> => {
    this.logDebug(`WsServerLogic.send from ${this.props.host}:${this.props.port} to connection ${connectionId}, data length ${data.length}`)

    return this.wsServerIo.send(this.serverId, connectionId, data)
  }

  // TODO: оно нужно ???
  // async setCookie(connectionId: string, cookie: string) {
  //   const data = `${SETCOOKIE_LABEL}${cookie}`;
  //
  //   this.logDebug(`WsServerLogic.setCookie from ${this.props.host}:${this.props.port} to connection ${connectionId}, ${data}`);
  //
  //   return this.wsServerIo.send(this.serverId, connectionId, data);
  // }

  /**
   * Force closing a connection.
   * Close event will be risen
   */
  closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
    this.logDebug(`WsServerLogic server ${this.props.host}:${this.props.port} manually closes connection ${connectionId}`)
    // TODO: проверить будет ли поднято событие close ???
    return this.wsServerIo.closeConnection(this.serverId, connectionId, code, reason)
  }

  async destroyConnection(connectionId: string) {
    this.logDebug(`WsServerLogic server ${this.props.host}:${this.props.port} destroys connection ${connectionId}`);
    // TODO: может проще тут отписаться от события и выполнить просто close
    // return this.wsServerIo.closeConnection(
    //   this.serverId,
    //   connectionId,
    //   WsCloseStatus.closeGoingAway,
    //   'Destroy connection'
    // )
    await this.wsServerIo.destroyConnection(this.serverId, connectionId)
  }

  /**
   * Listen income messages
   */
  onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): number {
    return this.events.addListener(WsServerEvent.incomeMessage, cb)
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

  // TODO: add events
  /*
  serverStarted,
  serverClosed,
  */

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }


  handleServerListening() {
    this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} started listening`);
    this._startedPromised.resolve()
    this.events.emit(WsServerEvent.serverStarted)
  }

  handleServerClose() {
    this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} has been closed`);
    //await this.removeListeners();

    this.serverId = ''

    this.onClose();
    this.events.destroy();
  }

  handleServerError(err: string) {
    this.logError(`Error on ws server ${this.props.host}:${this.props.port}. ${err}`)
    this.events.emit(WsServerEvent.serverError, err)
  }

  handleNewConnection(connectionId: string, params: WsServerConnectionParams) {
    this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} received a new connection ${p[1]}, ${JSON.stringify(p[2])}`)
    this.events.emit(WsServerEvent.newConnection, connectionId, params)
  }

  // TODO: add !!!
  // handleConnectionClose() {
  //   this.logDebug(`WsServerLogic connection ${connectionId} has been closed on server ${this.props.host}:${this.props.port} has been closed`);
  //   this.events.emit(WsServerEvent.closeConnection, connectionId);
  // }

  handleIncomeMessage(connectionId: string, data: string | Uint8Array) {
    this.logDebug(`WsServerLogic income message on server ${this.props.host}:${this.props.port}, connection id ${connectionId}, data length ${data.length}`);
    this.events.emit(WsServerEvent.incomeMessage, connectionId, data);
  }

  handleConnectionError(connectionId: string, err: string) {
    this.logError(`Error on ws server ${this.props.host}:${this.props.port} connection ${connectionId}. ${err}`)
    this.events.emit(WsServerEvent.connectionError, connectionId, err)
  }



//   this.logError(
// `Unexpected response has been received on server "${this.serverId}", ` +
// `connection "${connectionId}": ${JSON.stringify(response)}`
// );

  // private async listenServerEvents() {
  //
  //   // TODO: вместо этого использовать класс где подключение идёт повторно
  //   const listeningTimeout = setTimeout(() => {
  //     this.handleTimeout()
  //       .catch(this.logError);
  //   }, SERVER_STARTING_TIMEOUT_SEC * 1000);
  //
  //   // const listeningIndex: number = await this.wsServerIo.onServerListening(
  //   //   this.serverId,
  //   //   () => {
  //   //     clearTimeout(listeningTimeout);
  //   //     this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} started listening`);
  //   //     this._startedPromised.resolve();
  //   //   }
  //   // );
  //   // const connectionIndex: number = await this.wsServerIo.onConnection(
  //   //   this.serverId,
  //   //   (connectionId: string, request: ConnectionParams) => {
  //   //     this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} received a new connection ${connectionId}, ${JSON.stringify(request)}`);
  //   //     this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, request);
  //   //   }
  //   // );
  //   // const closeIndex: number = await this.wsServerIo.onServerClose(
  //   //   this.serverId,
  //   //   () => {
  //   //     clearTimeout(listeningTimeout);
  //   //     this.handleCloseServer()
  //   //       .catch(this.logError);
  //   //   }
  //   // );
  //   //const errorIndex: number = await this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  //
  //   // this.handlerIndexes.push([WsServerEvent.serverStarted, listeningIndex])
  //   // this.handlerIndexes.push([WsServerEvent.newConnection, connectionIndex])
  //   // this.handlerIndexes.push([WsServerEvent.serverClosed, closeIndex])
  //   // this.handlerIndexes.push([WsServerEvent.serverError, errorIndex])
  //
  //   // TODO: нужно сохранить handler index?
  //
  //   const serverHandlerIndex = this.wsServerIo.on(
  //     (event: WsServerEvent, ...p: any[]) => {
  //       if (p[0] !== this.serverId) return
  //
  //       switch (event) {
  //         case WsServerEvent.serverStarted:
  //           clearTimeout(listeningTimeout)
  //           this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} started listening`);
  //           this._startedPromised.resolve()
  //           this.events.emit(WsServerEvent.serverStarted)
  //
  //           break
  //         case WsServerEvent.newConnection:
  //           this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} received a new connection ${p[1]}, ${JSON.stringify(p[2])}`);
  //           this.events.emit(WsServerEvent.newConnection, p[1], p[2]);
  //
  //           break
  //         case WsServerEvent.serverClosed:
  //           clearTimeout(listeningTimeout)
  //           this.handleCloseServer()
  //             .catch(this.logError)
  //
  //           break
  //         case WsServerEvent.serverError:
  //           this.events.emit(WsServerEvent.serverError, String(p[1]))
  //           this.logError(`Error on ws server ${this.props.host}:${this.props.port}. ${String(p[1])}`)
  //
  //           break
  //       }
  //     }
  //   )
  // }

/*  private async listenConnectionEvents() {

    // TODO: review

    const closeIndex: number = await this.wsServerIo.onClose(
      this.serverId,
      (connectionId: string) => {
        this.logDebug(`WsServerLogic connection ${connectionId} has been closed on server ${this.props.host}:${this.props.port} has been closed`);
        this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
      }
    );
    const messageIndex: number = await this.wsServerIo.onMessage(
      this.serverId,
      (connectionId: string, data: string | Uint8Array) => {
        this.logDebug(`WsServerLogic income message on server ${this.props.host}:${this.props.port}, connection id ${connectionId}, data length ${data.length}`);
        this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
      }
    );
    const errorIndex: number = await this.wsServerIo.onError(
      this.serverId,
      (connectionId: string, err: Error) => this.logError(String(err))
    );
    const unexpectedIndex: number = await this.wsServerIo.onUnexpectedResponse(
      this.serverId,
      (connectionId: string, response: ConnectionParams) => {
        this.logError(
          `Unexpected response has been received on server "${this.serverId}", ` +
          `connection "${connectionId}": ${JSON.stringify(response)}`
        );
      }
    );

    this.handlerIndexes.push([WsServerEvent.clientClose, closeIndex]);
    this.handlerIndexes.push([WsServerEvent.clientMessage, messageIndex]);
    this.handlerIndexes.push([WsServerEvent.clientError, errorIndex]);
    this.handlerIndexes.push([WsServerEvent.clientUnexpectedResponse, unexpectedIndex]);
  }*/

  // private async handleCloseServer() {
  //   this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} has been closed`);
  //   await this.removeListeners();
  //
  //   this.serverId = ''
  //
  //   this.onClose();
  //   this.events.destroy();
  // }

  // private async removeListeners() {
  //
  //   // TODO: review
  //
  //   for (let handlerIndex of this.handlerIndexes) {
  //     await this.wsServerIo.removeListener(this.serverId, handlerIndex[HANDLER_INDEX_POSITION]);
  //   }
  // }
  //
  // private async handleTimeout() {
  //   this._startedPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
  //   await this.removeListeners()
  //   await this.wsServerIo.closeServer(this.serverId)
  //
  //   // TODO: а повторно надо же делать
  // }

}
