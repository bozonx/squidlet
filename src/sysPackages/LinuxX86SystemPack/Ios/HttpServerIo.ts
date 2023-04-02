import {createServer, IncomingMessage, Server, ServerResponse} from 'http'
import {HttpServerEvent, HttpServerIoType, HttpServerProps} from '../../../types/io/HttpServerIoType.js'
import {WsServerProps} from '../../../types/io/WsServerIoType.js'
import {HttpResponse} from '../../../types/Http.js'
import {ServerIoBase} from '../../../system/Io/ServerIoBase.js'


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


export default class HttpServerIo extends ServerIoBase<ServerItem, HttpServerProps> implements HttpServerIoType {
  /**
   * Send response back to client of it request and close request.
   */
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

  protected makeServer(serverId: string, props: HttpServerProps): ServerItem {
    const server: Server = createServer({
      // TODO: get from IO config
      // // timeout of entire request in ms
      // requestTimeout: 60000,
    })

    server.on('error', (err: Error) =>
      this.events.emit(HttpServerEvent.serverError, String(err)))
    server.on('close', () =>
      this.events.emit(HttpServerEvent.serverClose))
    server.on('listening', () =>
      this.handleServerStartListening(serverId))
    server.on('request', (req: IncomingMessage, res: ServerResponse) =>
      this.handleIncomeRequest(serverId, req, res))

    server.listen(props.port, props.host)

    return [
      server,
      // not listening at the moment
      false
    ]
  }

  protected async destroyServer(serverId: string) {
    if (!this.servers[serverId]) return

    // TODO: если раскоментировать то будет ошибка при дестрое
    //await callPromised(serverItem[ITEM_POSITION.server].close.bind(serverItem[ITEM_POSITION.server]));

    delete this.servers[serverId]

    // TODO: НЕ должно при этом подняться событие close или должно???
    // TODO: отписаться от всех событий навешанный на этот сервер
  }

  protected makeServerId(props: WsServerProps): string {
    return `${props.host}:${props.port}`
  }


  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId);

    serverItem[ITEM_POSITION.listeningState] = true;

    this.events.emit(HttpServerEvent.listening, serverId)
  }

  private handleIncomeRequest(serverId: string, req: IncomingMessage, res: ServerResponse) {
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

}
