import {DriverIndex} from '../../types/types.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverBase} from '../../system/driver/DriverBase.js'


export const WsServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new WsServerDriver(ctx)
}

export class WsServerDriver extends DriverBase {

}
