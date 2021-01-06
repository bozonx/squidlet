import {IoBase} from '../IoBase'


export enum WsClientEvent {
  open,
  close,
  incomeMessage,
  error,
  //unexpectedResponse,
}

//export type OnMessageHandler = (data: string | Uint8Array) => void;

export interface WsClientProps {
  url: string
  headers?: Record<string, string>
}


export default interface WsClientIo extends IoBase {
  on(
    eventName: WsClientEvent.open,
    cb: (connectionId: string) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.close,
    cb: (connectionId: string) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.incomeMessage,
    cb: (connectionId: string, data: string | Uint8Array) => void
  ): Promise<number>
  on(
    eventName: WsClientEvent.error,
    cb: (connectionId: string, err: string) => void
  ): Promise<number>

  newConnection       (props: WsClientProps): Promise<string>

  send                (connectionId: string, data: string | Uint8Array): Promise<void>
  close               (connectionId: string, code: number, reason?: string): Promise<void>
  destroyConnection   (connectionId: string): Promise<void>

  //reConnect           (connectionId: string, props: WebSocketClientProps): Promise<void>
}
