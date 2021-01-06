import {IoBase} from '../IoBase'


export enum WsClientEvent {
  opened,
  closed,
  error,
  incomeMessage,
}

export interface WsClientProps {
  url: string
  headers?: Record<string, string>
}


export default interface WsClientIo extends IoBase {
  on(
    eventName: WsClientEvent.opened,
    cb: (connectionId: string) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.closed,
    cb: (connectionId: string) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.error,
    cb: (connectionId: string, err: string) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.incomeMessage,
    cb: (connectionId: string, data: string | Uint8Array) => void
  ): Promise<number>

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WsClientProps): Promise<string>
  sendMessage(connectionId: string, data: string | Uint8Array): Promise<void>
  closeConnection(connectionId: string, code: number, reason?: string): Promise<void>

  //destroyConnection(connectionId: string): Promise<void>
  //reConnect           (connectionId: string, props: WebSocketClientProps): Promise<void>
}
