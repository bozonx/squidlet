import {IoContext} from '../../system/Io/IoContext.js'
import {WsServerIo} from './WsServerIo.js'


export function WsServerIoIndex () {
  return (ctx: IoContext) => {
    return new WsServerIo(ctx)
  }
}
