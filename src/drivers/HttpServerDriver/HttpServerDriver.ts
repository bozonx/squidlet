import {DriverContext} from '../../system/driver/DriverContext.js'
import {DriverIndex} from '../../types/types.js'
import DriverFactoryBase from '../../system/driver/DriverFactoryBase.js'
import {HttpServerIo} from '../../ios/NodejsPack/HttpServerIo.js'
import DriverInstanceBase from '../../system/driver/DriverInstanceBase.js'
import {IO_NAMES} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'
import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from './HttpServerLogic.js'


export const HttpServerDriverIndex: DriverIndex = (ctx: DriverContext) => {
  return new HttpServerDriver(ctx)
}

export class HttpServerInstance extends DriverInstanceBase {
  private server!: HttpServerLogic

  private get httpServerIo(): HttpServerIo {
    return this.ctx.io.getIo(IO_NAMES.HttpServerIo)
  }

  // private get closedMsg() {
  //   return `Server "${this.props.host}:${this.props.port}" has been already closed`;
  // }
  // // it fulfils when server is start listening
  // get listeningPromise(): Promise<void> {
  //   if (!this.server) {
  //     throw new Error(`HttpServer.listeningPromise: ${this.closedMsg}`);
  //   }
  //
  //   return this.server.listeningPromise;
  // }


  async init() {
    this.server = new HttpServerLogic(
      this.httpServerIo,
      this.props,
      () => {
        this.ctx.log.error(`HttpServer: ${this.closedMsg}, you can't manipulate it any more!`);
      },
      this.ctx.log.debug,
      this.ctx.log.info,
      this.ctx.log.error
    );

    await this.server.init();
  }

  async destroy() {
    await this.server.destroy();
  }


  async start() {

  }

  async stop(force?: boolean) {
    // await this.server?.closeServer();
    if (!this.server) throw new Error(`WebSocketServer.removeRequestListener: ${this.onRequest}`);

    return this.server.closeServer();
  }


  onRequest(cb: (request: HttpDriverRequest) => Promise<HttpDriverResponse>): number {
    if (!this.server) throw new Error(`WebSocketServer.onMessage: ${this.onRequest}`);

    return this.server.onRequest(cb);
  }

  removeRequestListener(handlerIndex: number) {
    if (!this.server) throw new Error(`WebSocketServer.removeRequestListener: ${this.onRequest}`);

    this.server.removeRequestListener(handlerIndex);
  }

}

export class HttpServerDriver extends DriverFactoryBase<HttpServerInstance> {
  protected SubDriverClass = HttpServerInstance

  protected instanceId = (props: HttpServerProps): string => {
    return `${props.host}:${props.port}`;
  }
}
