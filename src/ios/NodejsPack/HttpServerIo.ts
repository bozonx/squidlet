import {createServer, IncomingMessage, Server, ServerResponse} from 'http'
import {DEFAULT_ENCODE, IndexedEvents, makeUniqNumber, callPromised} from 'squidlet-lib'
import type {HttpRequest, HttpResponse} from 'squidlet-lib'
import {HttpServerEvent} from '../../types/io/HttpServerIoType.js'
import type {HttpServerIoType, HttpServerProps} from '../../types/io/HttpServerIoType.js'
import {ServerIoBase} from '../../base/ServerIoBase.js'
import type {IoIndex} from '../../types/types.js'
import type {IoContext} from '../../system/context/IoContext.js'


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


export const HttpServerIoIndex: IoIndex = (ctx: IoContext) => {
  return new HttpServerIo(ctx)
}


export class HttpServerIo extends ServerIoBase<ServerItem, HttpServerProps> implements HttpServerIoType {
  private responseEvent = new IndexedEvents<(
    requestId: number,
    response: HttpResponse
  ) => void>()
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
  async sendResponse(requestId: number, response: HttpResponse): Promise<void> {
    return this.responseEvent.emit(requestId, response)
  }


  protected startServer(serverId: string, props: HttpServerProps): ServerItem {
    const server: Server = createServer({
      // timeout of entire request in ms
      requestTimeout: this.cfg.requestTimeoutSec * 1000,
    })

    server.on('error', (err: Error) =>
      this.events.emit(HttpServerEvent.serverError, serverId, String(err)))
    server.on('close', () =>
      this.events.emit(HttpServerEvent.serverClose, serverId))
    server.on('listening', () =>
      this.handleServerStartListening(serverId))
    server.on('request', (req: IncomingMessage, res: ServerResponse) =>
      this.handleIncomeRequest(serverId, req, res))

    server.listen(props.port, props.host)

    return [
      server,
      // not listening at the moment. Wait listen event
      false
    ]
  }

  protected async destroyServer(serverId: string) {
    if (!this.servers[serverId]) return

    const serverItem = this.getServerItem(serverId)

    // TODO: НЕ должно при этом подняться событие close или должно???
    await callPromised(
      serverItem[ITEM_POSITION.server].close.bind(serverItem[ITEM_POSITION.server])
    )

    delete this.servers[serverId]
  }

  protected makeServerId(props: HttpServerProps): string {
    return `${props.host}:${props.port}`
  }


  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId)

    serverItem[ITEM_POSITION.listeningState] = true

    this.events.emit(HttpServerEvent.listening, serverId)
  }

  /**
   * When income request is came then it wait for a response from driver
   * while it call sendResponse(). And after that it return the response.
   * @param serverId
   * @param req
   * @param res
   * @private
   */
  private handleIncomeRequest(serverId: string, req: IncomingMessage, res: ServerResponse) {
    if (!this.servers[serverId]) return

    let waitTimeout: any
    const requestId: number = makeUniqNumber()
    const httpRequest: HttpRequest = this.makeRequestObject(req)

    const handlerIndex = this.responseEvent.addListener(
      (receivedRequestId: number, response: HttpResponse) => {
        // listen only expected requestId
        if (receivedRequestId !== requestId) return

        clearTimeout(waitTimeout)
        this.responseEvent.removeListener(handlerIndex)

        this.setupResponse(response, res)
      }
    )

    waitTimeout = setTimeout(() => {
      this.responseEvent.removeListener(handlerIndex)
      this.events.emit(
        HttpServerEvent.serverError,
        serverId,
        `HttpServerIo: Wait for response: Timeout has been exceeded. ` +
        `Server ${serverId}. ${req.method} ${req.url}`
      )
      // send request timeout code
      res.writeHead(408)
      res.end()
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
    httpRes.writeHead(response.status, response.headers as Record<string, any>)

    if (typeof response.body === 'string') {
      httpRes.end(response.body)
    }
    else {
      // TODO: support of Buffer - convert from Uint8Arr to Buffer
    }
  }

}
