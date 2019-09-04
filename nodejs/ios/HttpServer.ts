import * as express from 'express';
import {Express, NextFunction, Request, Response} from 'express';

import {
  HttpRequest,
  HttpRequestHandler,
  HttpResponse,
  HttpServerEvent,
  HttpServerIo,
  HttpServerProps
} from 'system/interfaces/io/HttpServerIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';
import {WAIT_RESPONSE_TIMEOUT} from 'system/constants';
import {makeUniqNumber} from '../../system/lib/uniqId';


enum ITEM_POSITION {
  server,
  events,
}

const RESPONSE_EVENT = 'res';

type ServerItem = [ Express, IndexedEventEmitter<AnyHandler> ];


export default class HttpServer implements HttpServerIo{
  private readonly servers: ServerItem[] = [];


  async destroy() {
    for (let serverId in this.servers) {
      // destroy events of server
      this.servers[Number(serverId)][ITEM_POSITION.events].destroy();

      // TODO: what to do ????
      //await this.destroyServer(serverId);
    }
  }


  async newServer(props: HttpServerProps): Promise<string>{
    const serverId: string = String(this.servers.length);

    this.servers.push( this.makeServer(serverId, props) );

    return serverId;
  }

  async closeServer(serverId: string): Promise<void> {
    // TODO: должно при этом подняться событие close
    // TODO: !!!
  }

  async onServerClose(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(HttpServerEvent.serverClose, cb);
  }

  async onServerError(serverId: string, cb: (err: string) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(HttpServerEvent.serverError, cb);
  }

  async onServerListening(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(HttpServerEvent.listening, cb);
  }

  async onRequest(serverId: string, cb: HttpRequestHandler): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(HttpServerEvent.request, cb);
  }

  async sendResponse(serverId: string, requestId: number, response: HttpResponse): Promise<void> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].emit(RESPONSE_EVENT, requestId, response);
  }

  async removeListener(serverId: string, eventName: HttpServerEvent, handlerIndex: number): Promise<void> {
    if (!this.servers[Number(serverId)]) return;

    return this.servers[Number(serverId)][ITEM_POSITION.events].removeListener(eventName, handlerIndex);
  }


  private makeServer(serverId: string, props: HttpServerProps): ServerItem {
    const events = new IndexedEventEmitter();
    const server: Express = express();

    server.all('*', (req: Request, res: Response, next: NextFunction) => {
      this.handleIncomeRequest(serverId, req, res)
        .then(next)
        .catch((err) => {
          events.emit(HttpServerEvent.serverError, err);
          // TODO: проверить что вернуться в случае ошибки
          next(err);
        });
    });

    /*
      // Your own super cool function
      var logger = function(req, res, next) {
          console.log("GOT REQUEST !");
          next(); // Passing the request to the next handler in the stack.
      }

      app.configure(function(){
          app.use(logger); // Here you add your logger to the stack.
          app.use(app.router); // The Express routes handler.
      });
     */

    server.listen(props.port, props.host, () => events.emit(HttpServerEvent.listening));
    //server.on();
    // TODO: listen server close
    // TODO: listen server error

    return [
      server,
      events,
    ];
  }

  private handleIncomeRequest(serverId: string, req: Request, res: Response): Promise<void> {
    const events = this.servers[Number(serverId)][ITEM_POSITION.events];

    return new Promise<void>((resolve, reject) => {
      let handlerIndex: number;
      let waitTimeout: any;
      const requestId: number = makeUniqNumber();
      const httpRequest: HttpRequest = this.makeRequestObject(req);

      // TODO: remove
      console.log('------ httpRequest', httpRequest)

      const respHandler = (receivedRequestId: number, response: HttpResponse) => {
        // listen only expected requestId
        if (receivedRequestId !== requestId) return;

        clearTimeout(waitTimeout);
        events.removeListener(RESPONSE_EVENT, handlerIndex);

        this.setupResponse(response, res);

        resolve();
      };

      handlerIndex = events.addListener(RESPONSE_EVENT, respHandler);

      waitTimeout = setTimeout(() => {
        events.removeListener(RESPONSE_EVENT, handlerIndex);
        reject(`Timeout has been exceeded. Server ${serverId}. ${req.method} ${req.url}`);
      }, WAIT_RESPONSE_TIMEOUT);

      events.emit(HttpServerEvent.request, requestId, httpRequest);
    });
  }

  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`РеезServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)];
  }

  private makeRequestObject(req: Request): HttpRequest {
    let body: string | Buffer;

    if (typeof req.body === 'string') {
      body = req.body;
    }
    else {
      // TODO: convert Uint8Array to Buffer
      body = req.body;
    }

    return  {
      // TODO: в каком формате method и форматируется ли он??? нуно ли делать toLowerCase()
      method: req.method.toLowerCase() as any,
      url: req.url,
      headers: req.headers as any,
      body,
    };
  }

  private setupResponse(response: HttpResponse, expressRes: Response) {
    for (let headerName of Object.keys(response.headers)) {
      expressRes.setHeader(headerName, (response.headers as any)[headerName]);
    }

    expressRes.status(response.status);

    if (typeof response.body === 'string') {
      expressRes.send(response.body);
    }
    else {
      // TODO: support of Buffer - convert from Uint8Arr to Buffer
    }
  }

}
