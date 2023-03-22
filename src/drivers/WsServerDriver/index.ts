import {DriverContext} from '../../system/driver/DriverContext.js'
import {WsServer} from './WsServer.js'


export function WsServerDriver () {
  return (ctx: DriverContext) => {
    return new WsServer(ctx)
  }
}
