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
import IndexedEvents from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import ActiveHosts, {HostItem} from './ActiveHosts';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import Router from './Router';


// interface NodeProps {
//   // driver name like: 'SerialNetwork' etc
//   driver: string;
//   busId: string | number;
// }
//
// interface NetworkInterface extends NodeProps {
//   // props of network driver
//   [index: string]: any;
// }

export interface NetworkProps {
  // interfaces: NetworkInterface[];
  // closestHosts: {[index: string]: NodeProps};
  // networkMap: {[index: string]: any};
}

// like [ hostId, networkDriverNum, busId ]
//type AddressDefinition = [string, NetworkDriver, number | string];

export interface NetworkMessage {
  TTL: number;
  to: string;
  from: string;
  sender: string;
  payload: Uint8Array;
  uri: string;
}

// export interface NetworkRequest extends NetworkMessage {
// }
//
// export interface NetworkResponse extends NetworkMessage {
// }

export interface NetworkResponseFull extends NetworkMessage {
  // TODO: может отправлять вторым аргументом?
  connectionMessage: ConnectionMessage;
}

type NetworkOnRequestHandler = (request: NetworkMessage) => Promise<NetworkMessage>;
type IncomeRequestsHandler = (request: NetworkMessage) => void;

// TODO: review
// enum NetworkDriver {
//   serial,
//   mqtt,
//   wsServer,
//   wsClient,
//   i2cMaster,
//   i2cSlave,
// }

//export const NETWORK_PORT = 255;

// TODO: use config's
// max 255
const DEFAULT_TTL = 10;
// channel of connection which network uses to send and receive messages
const SEND_RECEIVE_CHANNEL = 254;
export const RESPONSE_STATUS_URI = {
  routed: '00',
  response: '01',
  responseError: '02',
  timeout: '03',
};


export default class Network extends ServiceBase<NetworkProps> {
  private incomeRequestsEvent = new IndexedEvents<IncomeRequestsHandler>();
  private readonly activeHosts: ActiveHosts;
  private readonly router: Router;

  //private readonly router: Router;
  // link between { sessionId: [ hostId, networkDriverNum, busId ] }
  //private sessionLinks: {[index: string]: AddressDefinition} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    //this.router = new Router(this.context, this.props);
    this.activeHosts = new ActiveHosts();
    this.router = new Router();
  }


  init = async () => {
    this.initConnections();
    // await this.router.init();
    // this.router.onIncomeDestMessage(this.handleIncomeMessage);

    // TODO: собрать все используемые connections
    // TODO: навешаться на все используемые connections
  }

  destroy = async () => {
    //this.router.destroy();
  }


  async request(hostId: string, uri: string, payload: Uint8Array): Promise<NetworkResponseFull> {
    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(hostId);

    if (!connectionItem) {
      throw new Error(`Host "${hostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem.connectionName);
    const request: NetworkMessage = {
      to: hostId,
      from: this.context.config.id,
      sender: this.context.config.id,
      TTL: DEFAULT_TTL,
      uri,
      payload,
    };
    const encodedMessage: Uint8Array = encodeNetworkMessage(request);
    // make request
    const connectionResponse: ConnectionResponse = await connection.request(
      connectionItem.connectionId,
      SEND_RECEIVE_CHANNEL,
      encodedMessage
    );

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.payload) {
      throw new Error(`Result doesn't contains the payload`);
    }

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

  onRequest(handler: NetworkOnRequestHandler): number {
    // TODO: нужно всетаки сделать обертку в которой выполнить хэндлер и сформировать ответ
    const cbWrapper = (request: NetworkMessage): void => {
      try {
        handler(request)
          .then((response: NetworkMessage) => this.sendResponseBack(response))
          .catch((e) => {
            // TODO: add
          });
      }
      catch (e) {
        // TODO: add
      }
    };

    return this.incomeRequestsEvent.addListener(cbWrapper);
  }

  removeListener(handlerIndex: number): void {
    this.incomeRequestsEvent.removeListener(handlerIndex);
  }


  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

  private async sendResponseBack(response: NetworkMessage) {
    const connection: Connection = await this.resolveConnection(response.hostId);
    // TODO: resolve it !!!!!
    const sessionId = '1';

    // TODO:  может использовать такой метов в connection.sendResponseBack()
    const result: ConnectionResponse = await connection.request(
      sessionId,
      response.channel,
      // TODO: в случае ошибки отправить error
      response.payload,
    );
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
      connectionId: string
    ): Promise<ConnectionResponse> => {
      return this.handleIncomeMessage(request, connectionId,connection);
    });
    connection.onNewConnection((connectionId: string) => {
      // TODO: зарегистрировать соединение
    });
    connection.onEndConnection((connectionId: string) => {
      // TODO: закрыть соединение
    });
  }

  private async handleIncomeMessage(
    request: ConnectionRequest,
    connectionId: string,
    connection: Connection
  ): Promise<ConnectionResponse> {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(request.payload);

    // TODO: зарегистрировать соединение в кэше если не было

    if (this.router.hasToBeRouted(incomeMessage)) {
      this.router.sendFurther(incomeMessage);

      return {
        channel: request.channel,
        requestId: request.requestId,
        status: ConnectionStatus.responseOk,
        // TODO: add payload
        payload,
      };
    }
    else {
      // TODO: call cb - rise event
    }
    // TODO: сформировать ответ ??? наверное ответ со статусом куда оно переправленно
  }

}
