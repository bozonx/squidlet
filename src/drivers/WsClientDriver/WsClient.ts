import {DriverBase} from '../../system/driver/DriverBase.js'
import {DriverContext} from '../../system/driver/DriverContext.js'


export class WsClient extends DriverBase {
  readonly name = 'WsClient'

  constructor(context: DriverContext) {
    super(context)
  }
}
