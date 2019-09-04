import * as express from 'express';
import {Express} from 'express';
import {
  HttpRequestHandler,
  HttpResponse,
  HttpServerEvent,
  HttpServerIo,
  HttpServerProps
} from '../../system/interfaces/io/HttpServerIo';
import {NextFunction, Request, Response} from 'express-serve-static-core';


type ServerItem = [ Express ];


export default class HttpServer implements HttpServerIo{
  private readonly servers: ServerItem[] = [];


  async destroy() {
    for (let serverId in this.servers) {
      // destroy events of server
      this.servers[Number(serverId)][SERVER_POSITIONS.events].destroy();

      await this.destroyServer(serverId);
    }
  }

  // TODO: method.toLowerCase()


  async newServer(props: HttpServerProps): Promise<string>{
    const serverId: string = String(this.servers.length);

    this.servers.push( this.makeServer(serverId, props) );

    return serverId;
  }

  async closeServer(serverId: string): Promise<void> {
    // TODO: должно при этом подняться событие close

  }

  async onServerClose(serverId: string, cb: () => void): Promise<number> {

  }

  async onServerError(serverId: string, cb: (err: string) => void): Promise<number> {

  }

  async onServerListening(serverId: string, cb: () => void): Promise<number> {

  }

  async onRequest(serverId: string, cb: HttpRequestHandler): Promise<number> {

  }

  async sendResponse(requestId: number, response: HttpResponse): Promise<void> {

  }

  async removeListener(serverId: string, eventName: HttpServerEvent, handlerIndex: number): Promise<void> {

  }


  private makeServer(serverId: string, props: HttpServerProps): ServerItem {
    const app: Express = express();

    app.all(/.*/, (req: Request, res: Response, next: NextFunction) => {
      // TODO: поднимать события
    });

    app.listen(props.port, props.host, () => {
      // TODO: поднять событие listening
      console.log('Example app listening on port 3000!');
    });
  }

}
