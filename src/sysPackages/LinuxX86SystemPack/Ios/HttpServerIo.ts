import {createServer, IncomingMessage, Server, ServerResponse} from 'http'
import {DEFAULT_ENCODE, IndexedEvents, makeUniqNumber} from 'squidlet-lib'
import {HttpServerEvent, HttpServerIoType, HttpServerProps} from '../../../types/io/HttpServerIoType.js'
import {WsServerProps} from '../../../types/io/WsServerIoType.js'
import {HttpRequest, HttpResponse} from '../../../types/Http.js'
import {ServerIoBase} from '../../../system/Io/ServerIoBase.js'


type ServerItem = [
  // Http server instance
  Server,
  // is server listening.
  boolean
]

enum ITEM_POSITION {
  server,
  listeningState
}

export interface HttpServerIoConfig {
  requestTimeoutSec: number
}

const HTTP_SERVER_IO_CONFIG_DEFAULTS = {
  requestTimeoutSec: 60
}


export default class HttpServerIo extends ServerIoBase<ServerItem, HttpServerProps> implements HttpServerIoType {
  private responseEvent = new IndexedEvents<(requestId: number, response: HttpResponse) => void>()
  private cfg: HttpServerIoConfig = HTTP_SERVER_IO_CONFIG_DEFAULTS


  init = async (cfg?: HttpServerIoConfig)=> {
    this.cfg = {
      ...HTTP_SERVER_IO_CONFIG_DEFAULTS,
      ...cfg,
    }
  }


  /**
   * Receive response to request and after that
   * send response back to client of it request and close request.
   */
  async sendResponse(serverId: string, requestId: number, response: HttpResponse): Promise<void> {
    return this.responseEvent.emit(requestId, response)
  }


  protected makeServer(serverId: string, props: HttpServerProps): ServerItem {
    const server: Server = createServer({
      // timeout of entire request in ms
      requestTimeout: this.cfg.requestTimeoutSec * 1000,
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
    if (!this.servers[serverId]) return

    let waitTimeout: any
    const requestId: number = makeUniqNumber()
    const httpRequest: HttpRequest = this.makeRequestObject(req)

    const handlerIndex = this.responseEvent.addListener((receivedRequestId: number, response: HttpResponse) => {
      // listen only expected requestId
      if (receivedRequestId !== requestId) return

      clearTimeout(waitTimeout)
      this.responseEvent.removeListener(handlerIndex)

      this.setupResponse(response, res)
    })

    waitTimeout = setTimeout(() => {
      this.responseEvent.removeListener(handlerIndex)
      this.events.emit(
        HttpServerEvent.serverError,
        serverId,
        `HttpServerIo: Wait for response: Timeout has been exceeded. ` +
        `Server ${serverId}. ${req.method} ${req.url}`
      );
    }, this.cfg.requestTimeoutSec * 1000);

    this.events.emit(HttpServerEvent.request, serverId, requestId, httpRequest)
  }

  private makeRequestObject(req: IncomingMessage): HttpRequest {
    const bodyBuff: Buffer | null = req.read()
    const body: string | undefined = bodyBuff?.toString(DEFAULT_ENCODE)

    // TODO: если content type бинарный то преобразовать body в Uint8

    return  {
      // method of http request is in upper case format
      method: (req.method || 'get').toLowerCase() as any,
      url: req.url || '',
      headers: req.headers as any,
      body,
    };
  }

  private setupResponse(response: HttpResponse, httpRes: ServerResponse) {

    // TODO: review

    httpRes.writeHead(response.status, response.headers as {[index: string]: string});

    if (typeof response.body === 'string') {
      httpRes.end(response.body);
    }
    else {
      // TODO: support of Buffer - convert from Uint8Arr to Buffer
    }
  }

}