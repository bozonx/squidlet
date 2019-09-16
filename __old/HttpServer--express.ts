// @ts-ignore
import express from 'express';
import {Express, NextFunction, Request, Response} from 'express';
import {Server} from 'http';

import {
  HttpRequestHandler,
  HttpServerEvent,
  HttpServerIo,
  HttpServerProps
} from 'interfaces/io/HttpServerIo';
import IndexedEventEmitter from 'lib/IndexedEventEmitter';
import {AnyHandler} from 'lib/IndexedEvents';
import {WAIT_RESPONSE_TIMEOUT_SEC} from 'constants';
import {makeUniqNumber} from 'lib/uniqId';
import {callPromised} from 'lib/common';
import {HttpRequest, HttpResponse} from 'interfaces/Http';


type ServerItem = [
  // Express app
  Express,
  // Http server instance
  Server,
  // server's events
  IndexedEventEmitter<AnyHandler>,
  // is server listening.
  boolean
];

enum ITEM_POSITION {
  app,
  server,
  events,
  listeningState
}

const RESPONSE_EVENT = 'res';


export default class HttpServer implements HttpServerIo {
  private readonly servers: ServerItem[] = [];


  async destroy() {
    for (let serverId in this.servers) {
      // destroy events of server
      this.servers[Number(serverId)][ITEM_POSITION.events].destroy();

      // TODO: not emit events
      await this.closeServer(serverId);
    }
  }


  async newServer(props: HttpServerProps): Promise<string>{
    const serverId: string = String(this.servers.length);

    this.servers.push( this.makeServer(serverId, props) );

    return serverId;
  }

  async closeServer(serverId: string): Promise<void> {
    const serverIdNum: number = Number(serverId);
    if (!this.servers[serverIdNum]) return;

    const serverItem = this.servers[serverIdNum];

    serverItem[ITEM_POSITION.events].destroy();
    await callPromised(serverItem[ITEM_POSITION.server].close.bind(serverItem[ITEM_POSITION.server]));

    delete this.servers[serverIdNum];

    // TODO: НЕ должно при этом подняться событие close или должно???
    // TODO: отписаться от всех событий навешанный на этот сервер
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

    if (serverItem[ITEM_POSITION.listeningState]) {
      cb();

      return -1;
    }

    return serverItem[ITEM_POSITION.events].once(HttpServerEvent.listening, cb);
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
    const app: Express = express();

    app.all('*', (req: Request, res: Response, next: NextFunction) => {
      this.handleIncomeRequest(serverId, req, res)
        .then(next)
        .catch((err) => {
          events.emit(HttpServerEvent.serverError, err);
          // TODO: проверить что вернуться в случае ошибки
          next(err);
        });
    });

    const server: Server = app.listen(props.port, props.host, () => this.handleServerStartListening(serverId));

    server.on('error', (err: Error) => events.emit(HttpServerEvent.serverError, String(err)));
    server.on('close', () => events.emit(HttpServerEvent.serverClose));

    return [
      app,
      server,
      events,
      // not listening at the moment
      false
    ];
  }

  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId);

    serverItem[ITEM_POSITION.listeningState] = true;

    serverItem[ITEM_POSITION.events].emit(HttpServerEvent.listening);
  }

  private handleIncomeRequest(serverId: string, req: Request, res: Response): Promise<void> {
    const events = this.servers[Number(serverId)][ITEM_POSITION.events];

    return new Promise<void>((resolve, reject) => {
      let handlerIndex: number;
      let waitTimeout: any;
      const requestId: number = makeUniqNumber();
      const httpRequest: HttpRequest = this.makeRequestObject(req);

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
      }, WAIT_RESPONSE_TIMEOUT_SEC * 1000);

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
    let body: string | Buffer | undefined;

    if (typeof req.body === 'string') {
      body = req.body;
    }
    else {
      // TODO: convert Uint8Array to Buffer
      body = req.body;
    }

    return  {
      // method in express's request is in upper case format
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
