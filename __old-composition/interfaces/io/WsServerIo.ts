import {IoBase} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/system/interfaces/IoBase'


export enum WsServerEvent {
  serverStarted,
  serverClosed,
  // TODO: в какой момент возникает, может лучше с промисом отдать или с событием
  //serverError,
  newConnection,
  connectionClose,
  incomeMessage,
  connectionError,
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


export default interface WsServerIo extends IoBase {
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

  on(
    eventName: WsServerEvent.serverClosed,
    cb: (connectionId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.incomeMessage,
    cb: (connectionId: string, data: string | Uint8Array) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.connectionError,
    cb: (connectionId: string, err: Error) => void
  ): Promise<number>

  /**
   * When new client is connected
   */
  on(
    eventName: WsServerEvent.newConnection,
    cb: (serverId: string, connectionId: string, params: ConnectionParams) => void
  ): Promise<number>

  /**
   * when server starts listening
   */
  on(
    eventName: WsServerEvent.serverStarted,
    cb: (serverId: string) => void
  ): Promise<number>

  /**
   * on server close. Depend on http server close
   */
  on(
    eventName: WsServerEvent.serverClosed,
    cb: (serverId: string) => void
  ): Promise<number>

  //onServerError(serverId: string, cb: (err: Error) => void): Promise<number>
  //onUnexpectedResponse(serverId: string, cb: (connectionId: string, response: ConnectionParams) => void): Promise<number>

  off(handlerIndex: number): Promise<void>


  /**
   * Send message from server to the client.
   * It waits while message has been sent but it doesn't wait for response.
   */
  sendMessage(
    serverId: string,
    connectionId: string,
    data: string | Uint8Array
  ): Promise<void>

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
