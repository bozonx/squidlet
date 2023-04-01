import {createServer, IncomingMessage, Server, ServerResponse} from 'http'
import {IndexedEvents} from 'squidlet-lib'
import {IoBase} from '../../../system/Io/IoBase.js'
import {HttpServerIoType, HttpServerProps} from '../../../types/io/HttpServerIoType.js'
import {WsServerProps} from '../../../types/io/WsServerIoType.js'
import {HttpResponse} from '../../../types/Http.js'


type ServerItem = [
  // Http server instance
  Server,
  // is server listening.
  boolean
];

enum ITEM_POSITION {
  server,
  listeningState
}

//const RESPONSE_EVENT = 'res';


export default class HttpServer extends IoBase implements HttpServerIoType {
  private readonly events = new IndexedEvents()
  // like {'host:port': [server, events, connections[], isListening]}
  private readonly servers: Record<string, ServerItem> = {}


  destroy = async () => {
    for (let serverId in this.servers) {
      // TODO: not emit events
      await this.closeServer(serverId);
    }

    this.events.destroy()
  }


  async on(cb: (...p: any[]) => void): Promise<number> {
    return this.events.addListener(cb)
  }

  async off(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }

  async newServer(props: HttpServerProps): Promise<string>{
    const serverId: string = this.makeServerId(props)

    if (this.servers[serverId]) {
      throw new Error(`Server ${serverId} already exists`)
    }

    this.servers[serverId] = this.makeServer(serverId, props)

    return serverId
  }

  async closeServer(serverId: string): Promise<void> {
    const serverIdNum: number = Number(serverId);
    if (!this.servers[serverIdNum]) return;

    const serverItem = this.servers[serverIdNum];

    // TODO: если раскоментировать то будет ошибка при дестрое
    //await callPromised(serverItem[ITEM_POSITION.server].close.bind(serverItem[ITEM_POSITION.server]));

    delete this.servers[serverIdNum];

    // TODO: НЕ должно при этом подняться событие close или должно???
    // TODO: отписаться от всех событий навешанный на этот сервер
  }

  async sendResponse(serverId: string, requestId: number, response: HttpResponse): Promise<void> {
    // TODO: это вообще что ???
    return this.events.emit(RESPONSE_EVENT, requestId, response)
  }


  // async onServerListening(serverId: string, cb: () => void): Promise<number> {
  //   const serverItem = this.getServerItem(serverId);
  //
  //   if (serverItem[ITEM_POSITION.listeningState]) {
  //     cb();
  //
  //     return -1;
  //   }
  //
  //   return serverItem[ITEM_POSITION.events].once(HttpServerEvent.listening, cb);
  // }

  private makeServer(serverId: string, props: HttpServerProps): ServerItem {
    const events = new IndexedEventEmitter();
    const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleIncomeRequest(serverId, req, res)
          .catch((e: Error) => events.emit(HttpServerEvent.serverError, e));
    });

    server.on('error', (err: Error) => events.emit(HttpServerEvent.serverError, String(err)));
    server.on('close', () => events.emit(HttpServerEvent.serverClose));

    server.listen(props.port, props.host, () => this.handleServerStartListening(serverId));

    return [
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

  private handleIncomeRequest(serverId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.servers[Number(serverId)]) return Promise.resolve();

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
        events.removeListener(handlerIndex, RESPONSE_EVENT);

        this.setupResponse(response, res);

        resolve();
      };

      handlerIndex = events.addListener(RESPONSE_EVENT, respHandler);

      waitTimeout = setTimeout(() => {
        events.removeListener(handlerIndex, RESPONSE_EVENT);
        reject(
          `HttpServerIo: Wait for response: Timeout has been exceeded. ` +
          `Server ${serverId}. ${req.method} ${req.url}`
        );
      }, WAIT_RESPONSE_TIMEOUT_SEC * 1000);

      events.emit(HttpServerEvent.request, requestId, httpRequest);
    });
  }

  private makeRequestObject(req: IncomingMessage): HttpRequest {
    // TODO: review
    let body: string | Buffer | undefined;

    //req.

    // if (typeof req.body === 'string') {
    //   body = req.body;
    // }
    // else {
    //   // TODO: convert Uint8Array to Buffer
    //   body = req.body;
    // }

    //console.log(111111, req.method, req.url, req.headers);

    return  {
      // method of http request is in upper case format
      method: (req.method || 'get').toLowerCase() as any,
      url: req.url || '',
      headers: req.headers as any,
      body,
    };
  }

  private setupResponse(response: HttpResponse, httpRes: ServerResponse) {
    httpRes.writeHead(response.status, response.headers as {[index: string]: string});

    if (typeof response.body === 'string') {
      httpRes.end(response.body);
    }
    else {
      // TODO: support of Buffer - convert from Uint8Arr to Buffer
    }
  }


  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`HttpServer: Server "${serverId}" hasn't been found`)
    }

    return this.servers[Number(serverId)]
  }

  private makeServerId(props: WsServerProps): string {
    return `${props.host}:${props.port}`
  }

}
