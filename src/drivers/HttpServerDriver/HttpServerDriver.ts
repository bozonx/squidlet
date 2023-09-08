import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import DriverFactoryBase from '../../system/driver/DriverFactoryBase.js'
import {HttpServerIo} from '../../ios/NodejsPack/HttpServerIo.js'
import DriverInstanceBase from '../../system/driver/DriverInstanceBase.js'
import {IO_NAMES} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'


export const HttpServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpServerDriver(ctx)
}

export class HttpServerInstance extends DriverInstanceBase {
  private get httpServerIo(): HttpServerIo {
    return this.ctx.io.getIo(IO_NAMES.HttpServerIo)
  }


  async init() {

  }

  async destroy() {

  }


  async start() {

  }

  async stop(force?: boolean) {

  }

}

export class HttpServerDriver extends DriverFactoryBase<HttpServerInstance> {
  protected SubDriverClass = HttpServerInstance

  protected instanceId = (props: HttpServerProps): string => {
    return `${props.host}:${props.port}`;
  }
}
