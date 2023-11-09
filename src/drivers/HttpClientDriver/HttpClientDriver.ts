import type {DriverIndex} from '../../types/types.js'
import type {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverBase} from '../../base/DriverBase.js'


export const HttpClientDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpClientDriver(ctx)
}

export class HttpClientDriver extends DriverBase {

}
