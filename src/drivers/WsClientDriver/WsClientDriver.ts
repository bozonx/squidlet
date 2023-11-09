import type {DriverContext} from '../../system/context/DriverContext.js'
import type {DriverIndex} from '../../types/types.js'
import {DriverBase} from '../../base/DriverBase.js'


export const WsClientDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new WsClientDriver(ctx)
}

export class WsClientDriver extends DriverBase {

}
