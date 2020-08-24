import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionMessage,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {omitObj} from 'system/lib/objects';
import ActiveHosts, {HostItem} from './ActiveHosts';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import Router from './Router';
import {message} from 'gulp-typescript/release/utils';


export interface NetworkProps {
}

export interface NetworkMessage {
  TTL: number;
  to: string;
  from: string;
  // hosts between to and from
  route: string[];
  payload: Uint8Array;
  uri: string;
}

export interface NetworkResponseFull extends NetworkMessage {
  // TODO: может отправлять вторым аргументом?
  connectionMessage: ConnectionMessage;
}

type NetworkOnRequestHandler = (request: NetworkMessage) => Promise<NetworkMessage>;
type IncomeRequestsHandler = (request: NetworkMessage) => void;

// channel of connection which network uses to send and receive messages
const SEND_RECEIVE_CHANNEL = 254;
export const RESPONSE_STATUS_URI = {
  routed: '0',
  response: '1',
  responseError: '2',
  timeout: '3',
  getName: '4',
  ping: '5',
  pong: '6',
};


export default class Network extends ServiceBase<NetworkProps> {
  private readonly activeHosts: ActiveHosts;
  private readonly router: Router;
  private incomeRequestHandlers: {[index: string]: IncomeRequestsHandler} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.activeHosts = new ActiveHosts();
    this.router = new Router();
  }


  init = async () => {
    this.initConnections();
  }

  destroy = async () => {
    this.activeHosts.destroy();
    this.router.destroy();
    // TODO: clear incomeRequestHandlers
  }


  async request(hostId: string, uri: string, payload: Uint8Array): Promise<NetworkResponseFull> {
    if (uri.length <= 1) {
      throw new Error(`Uri has to have length greater than 1. One byte is for status number`);
    }

    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(hostId);

    if (!connectionItem) {
      throw new Error(`Host "${hostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem.connectionName);
    const request: NetworkMessage = {
      to: hostId,
      from: this.context.config.id,
      route: [],
      TTL: this.context.config.config.defaultTtl,
      uri,
      payload,
    };
    const encodedMessage: Uint8Array = encodeNetworkMessage(request);
    // make request
    const connectionResponse: ConnectionResponse = await connection.request(
      connectionItem.peerId,
      SEND_RECEIVE_CHANNEL,
      encodedMessage
    );

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.payload) {
      throw new Error(`Result doesn't contains the payload`);
    }

    // TODO: ответ ждать в течении таймаута так как он может уйти далеко
    // TODO: add uri response

    const response: NetworkMessage = decodeNetworkMessage(connectionResponse.payload);

    return {
      ...response,
      connectionMessage: omitObj(
        connectionResponse,
        'payload',
        'error'
      ) as ConnectionMessage,
    };
  }

  /**
   * Handle income requests. Only on handler of one uri is allowed.
   * @param uri
   * @param handler
   */
  onRequest(uri: string, handler: NetworkOnRequestHandler) {
    if (this.incomeRequestHandlers[uri]) {
      throw new Error(`Handler of uri has already defined`);
    }

    this.incomeRequestHandlers[uri] = handler;
  }

  removeListener(uri: string): void {
    delete this.incomeRequestHandlers[uri];
  }


  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

  private initConnections() {
    for (let serviceName of Object.keys(this.context.service)) {
      if (this.context.service[serviceName] !== CONNECTION_SERVICE_TYPE) continue;

      this.addConnectionListeners(this.context.service[serviceName]);
    }
  }

  private addConnectionListeners(connection: Connection) {
    connection.onRequest((
      request: ConnectionRequest,
      peerId: string
    ): Promise<ConnectionResponse> => {
      return this.handleIncomeMessage(request, peerId,connection);
    });
    connection.onNewConnection((peerId: string) => {
      // TODO: зарегистрировать соединение
    });
    connection.onEndConnection((peerId: string) => {
      // TODO: закрыть соединение
    });
  }

  private async handleIncomeMessage(
    request: ConnectionRequest,
    peerId: string,
    connection: Connection
  ): Promise<ConnectionResponse> {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(request.payload);

    // TODO: зарегистрировать соединение в кэше если не было

    if (this.router.hasToBeRouted(incomeMessage)) {
      this.router.sendFurther(incomeMessage);
      // send message back which means that income message was routed.
      return {
        channel: request.channel,
        // TODO: зачем вставлять requestId если он вставится в Connection ???
        requestId: request.requestId,
        status: ConnectionStatus.responseOk,
        payload: encodeNetworkMessage({
          TTL: this.context.config.config.defaultTtl,
          to: incomeMessage.from,
          from: this.context.config.id,
          route: [],
          uri: RESPONSE_STATUS_URI.routed,
          payload: new Uint8Array(0),
        }),
      };
    }
    else {
      if (!this.incomeRequestHandlers[incomeMessage.uri]) {
        // TODO: отправить ошибочное сообщение что нет обраотчика
      }

      try {
        // TODO: добавить данные connection - channel, requestId, status
        this.incomeRequestHandlers[incomeMessage.uri](message)
          .then((response: NetworkMessage) => this.sendResponseBack(response))
          .catch((e) => {
            // TODO: add
          });
      }
      catch (e) {
        // TODO: add
      }

      // TODO: нужно выполнить хэндлер и отправить ответ
      // TODO: сформировать ответ ??? наверное ответ со статусом куда оно переправленно


      // TODO: похоже что на 1 uri 1 обработчик иначе не понятно что возвращать
      // TODO: нужно всетаки сделать обертку в которой выполнить хэндлер и сформировать ответ
      // const cbWrapper = (request: NetworkMessage): void => {

      // };
      //
      // return this.incomeRequestsEvent.addListener(cbWrapper);
    }
  }

  private async sendResponseBack(response: NetworkMessage) {
    const connection: Connection = await this.resolveConnection(response.hostId);
    // TODO: resolve it !!!!!
    const sessionId = '1';

    const message: ConnectionResponse = {
      //channel: request.channel,
      // TODO: зачем вставлять requestId если он вставится в Connection ???
      //requestId: request.requestId,
      //status: ConnectionStatus.responseOk,
      payload: encodeNetworkMessage({
        TTL: this.context.config.config.defaultTtl,
        to: incomeMessage.from,
        from: this.context.config.id,
        route: [],
        uri: RESPONSE_STATUS_URI.routed,
        payload: new Uint8Array(0),
      }),
    };

    // TODO:  может использовать такой метов в connection.sendResponseBack()
    const result: ConnectionResponse = await connection.request(
      sessionId,
      response.channel,
      // TODO: в случае ошибки отправить error
      response.payload,
    );
  }

}
