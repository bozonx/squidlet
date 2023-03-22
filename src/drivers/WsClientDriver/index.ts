import {DriverContext} from '../../system/driver/DriverContext.js'
import {WsClient} from './WsClient.js'


export function WsClientDriver () {
  return (ctx: DriverContext) => {
    return new WsClient(ctx)
  }
}
