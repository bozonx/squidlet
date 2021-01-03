import {IoBase} from '../IoBase'


export const CONNECTION_ID_DELIMITER = '|'

// see https://github.com/Luka967/websocket-close-codes
export enum WsCloseStatus {
  // Successful operation / regular socket shutdown
  closeNormal = 1000,
  // Client is leaving (browser tab closing)
  closeGoingAway,
  // Internal server error while operating
  serverError = 1011,
}

export enum WsServerEvent {
  serverStarted,
  serverClosed,
  // TODO: в какой момент возникает, может лучше с промисом отдать или с событием
  //serverError,
  newConnection,
  connectionClose,
  incomeMessage,
  // server's or connection's errors
  error,
  // TODO: может просто общий канал ошибок
  //connectionError,
  // TODO: review
  //clientUnexpectedResponse,
}


export interface WsServerProps {
  // The hostname where to bind the server
  host: string
  // The port where to bind the server
  port: number
}

interface CommonHeaders {
  authorization?: string
  cookie?: string
  'set-cookie'?: string
  'user-agent'?: string
}

export interface WsServerConnectionParams {
  url: string
  method: string
  // TODO: а это будет? это же запрос а не ответ
  statusCode: number
  statusMessage: string
  headers: CommonHeaders
}


export default interface WsServerIo extends IoBase {
  // TODO: почему не поднимается событие ??
  /**
   * Destroy server and don't rise a close event.
   */
  destroy: () => Promise<void>

  on(
    eventName: WsServerEvent.serverStarted,
    cb: (serverId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.serverClosed,
    cb: (serverId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.newConnection,
    cb: (connectionId: string, params: WsServerConnectionParams, serverId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.incomeMessage,
    cb: (connectionId: string, data: string | Uint8Array) => void
  ): Promise<number>
  // on(
  //   eventName: WsServerEvent.connectionError,
  //   cb: (connectionId: string, err: Error) => void
  // ): Promise<number>
  on(
    eventName: WsServerEvent.connectionClose,
    cb: (serverId: string, connectionId: string) => void
  ): Promise<number>

  //onServerError(serverId: string, cb: (err: Error) => void): Promise<number>
  //onUnexpectedResponse(serverId: string, cb: (connectionId: string, response: ConnectionParams) => void): Promise<number>

  off(handlerIndex: number): Promise<void>


  /**
   * make new server and return serverId
   * If server has been ran then it just returns it serverId and doesn't create
   * a new server with the same host:port
   */
  newServer(props: WsServerProps): Promise<string>

  /**
   * Send message from server to the client.
   * It waits while message has been sent but it doesn't wait for response.
   */
  sendMessage(connectionId: string, data: string | Uint8Array): Promise<void>

  closeConnection(
    connectionId: string,
    code: WsCloseStatus,
    reason: string
  ): Promise<void>

  /**
   * Shut down a server which has been previously created.
   * After that a close event will be risen.
   */
  destroyServer(serverId: string): Promise<void>

  // /**
  //  * Destroy the connection and not rise an close event
  //  */
  // destroyConnection(serverId: string, connectionId: string): Promise<void>
}
