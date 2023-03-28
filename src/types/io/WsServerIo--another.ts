import {IoBase} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/IoBase.js'


export const CONNECTION_ID_DELIMITER = '|'
// TODO: лучше брать из конфига. И это не соединение а старт сервера
export const WS_SERVER_CONNECTION_TIMEOUT_SEC = 20

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
  // these events like WS_SERVER_DRIVER_EVENTS
  newConnection,
  connectionClosed,
  incomeMessage,
  // server's or connection's errors
  error,
  serverStarted,
  serverClosed,
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
  headers: CommonHeaders
  statusCode?: number
  statusMessage?: string
}


export default interface WsServerIoAnother extends IoBase {
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
    cb: (connectionId: string, data: string | Uint8Array, serverId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.connectionClosed,
    cb: (connectionId: string, code: WsCloseStatus, reason: string, serverId: string) => void
  ): Promise<number>
  on(
    eventName: WsServerEvent.error,
    cb: (err: string, serverId: string, connectionId?: string) => void
  ): Promise<number>


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
}