import {DriverIndex} from '../../types/types.js'
import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverBase} from '../../system/driver/DriverBase.js'


export const HttpClientDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpClientDriver(ctx)
}

export class HttpClientDriver extends DriverBase {

}
