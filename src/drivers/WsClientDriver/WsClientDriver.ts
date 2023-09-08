import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import {DriverBase} from '../../system/driver/DriverBase.js'


export const WsClientDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new WsClientDriver(ctx)
}

export class WsClientDriver extends DriverBase {

}
