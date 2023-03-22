import {IoContext} from '../../system/Io/IoContext.js'
import {WsClientIo} from './WsClientIo.js'


export function WsClientIoIndex () {
  return (ctx: IoContext) => {
    return new WsClientIo(ctx)
  }
}
