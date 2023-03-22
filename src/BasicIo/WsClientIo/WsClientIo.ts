import WebSocket from 'ws'
import {ClientRequest, IncomingMessage} from 'node:http'
import {IoBase} from '../../system/Io/IoBase.js'


export class WsClientIo extends IoBase {
  readonly name = 'WsClientIo'

  // constructor(ctx: IoContext) {
  //   super(ctx)
  // }

  async init(): Promise<void> {
    await super.init()
  }

  async destroy(): Promise<void> {
    await super.destroy()
  }

}
