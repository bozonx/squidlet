// TODO: лучше брать из конфига. И это не соединение а старт сервера
import type {IoBase} from '../../base/IoBase.js'

export const WS_SERVER_CONNECTION_TIMEOUT_SEC = 20


export enum WsServerEvent {
  // when server starts listening
  serverStarted,
  serverClosed,
  // TODO: в какой момент возникает, может лучше с промисом отдать или с событием
  serverError,
  newConnection,
  // connectionClose,
  // incomeMessage,
  // connectionError,
  // TODO: review
  //clientUnexpectedResponse,

  connectionClose,
  connectionMessage,
  connectionError,
  connectionUnexpectedResponse,
}


export interface WsServerProps {
  // The hostname where to bind the server
  host: string
  // The port where to bind the server
  port: number
}

interface CommonHeaders {
  Authorization?: string
  Cookie?: string
  'Set-Cookie'?: string
  'User-Agent'?: string
}

export interface WsServerConnectionParams {
  url: string
  method: string
  // TODO: а это будет? это же запрос а не ответ
  statusCode: number
  statusMessage: string
  headers: CommonHeaders
}


export interface WsServerIoType {
  /**
   * When new client is connected
   */
  on(
    cb: (
      eventName: WsServerEvent.newConnection,
      serverId: string,
      connectionId: string,
      params: WsServerConnectionParams
    ) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.serverClosed, serverId: string) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.serverStarted, serverId: string) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.serverError, serverId: string, error: string) => void
  ): Promise<number>

  ///////// Connection
  on(
    cb: (eventName: WsServerEvent.connectionError, serverId: string, connectionId: string, err: Error) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.connectionClose, serverId: string, connectionId: string, code?: number, reason?: string) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.connectionMessage, serverId: string, connectionId: string, data: Uint8Array) => void
  ): Promise<number>
  on(
    cb: (eventName: WsServerEvent.connectionUnexpectedResponse, serverId: string, connectionId: string, params: WsServerConnectionParams) => void
  ): Promise<number>

  off(handlerIndex: number): Promise<void>


  // TODO: почему не поднимается событие ??
  /**
   * Destroy server and don't rise a close event.
   */
  destroy: () => Promise<void>

  /**
   * make new server and return serverId
   * If server has been ran then it just returns it serverId and doesn't create
   * a new server with the same host:port
   */
  newServer(props: WsServerProps): Promise<string>

  /**
   * Shut down a server which has been previously created.
   * After that a close event will be risen.
   */
  closeServer(serverId: string): Promise<void>

  /**
   * Send message from server to the client.
   * It waits while message has been sent but it doesn't wait for response.
   */
  send(serverId: string, connectionId: string, data: Uint8Array): Promise<void>

  closeConnection(
    serverId: string,
    connectionId: string,
    code: number,
    reason: string
  ): Promise<void>

  // TODO: почему бы не указать параметр silent?
  /**
   * Destroy the connection and not rise an close event
   */
  destroyConnection(serverId: string, connectionId: string): Promise<void>

}

export type WsServerIoFullType = WsServerIoType & IoBase
