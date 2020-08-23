import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import Connection, {
  ConnectionMessage,
  ConnectionResponse,
  ConnectionStatus
} from '../../../system/interfaces/Connection';
import IndexedEvents from '../../../system/lib/IndexedEvents';
import ActiveHosts, {HostItem} from './ActiveHosts';
import {decodeNetworkResponse, encodeNetworkRequest} from './helpers';
import {omitObj} from '../../../system/lib/objects';


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

interface NetworkMessage {
  to: string;
  from: string;
  sender: string;
  TTL: number;
  body: Uint8Array;
}

export interface NetworkRequest extends NetworkMessage {
  url: string;
}

export interface NetworkResponse extends NetworkMessage {
  // TODO: может отправлять вторым аргументом?
  connectionMessage: ConnectionMessage;
}

type NetworkOnRequestHandler = (request: NetworkRequest) => Promise<NetworkResponse>;
type IncomeRequestsHandler = (request: NetworkRequest) => void;

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


export default class Network extends ServiceBase<NetworkProps> {
  private incomeRequestsEvent = new IndexedEvents<IncomeRequestsHandler>();
  private readonly activeHosts: ActiveHosts;

  //private readonly router: Router;
  // link between { sessionId: [ hostId, networkDriverNum, busId ] }
  //private sessionLinks: {[index: string]: AddressDefinition} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    //this.router = new Router(this.context, this.props);
    this.activeHosts = new ActiveHosts();
  }


  init = async () => {
    // await this.router.init();
    // this.router.onIncomeDestMessage(this.handleIncomeMessage);

    // TODO: собрать все используемые connections
    // TODO: навешаться на все используемые connections
  }

  destroy = async () => {
    //this.router.destroy();
  }


  async request(hostId: string, url: string, body: Uint8Array): Promise<NetworkResponse> {
    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(hostId);

    if (!connectionItem) {
      throw new Error(`Host "${hostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem?.connectionName);
    const request: NetworkRequest = {
      to: hostId,
      from: this.context.config.id,
      sender: this.context.config.id,
      TTL: DEFAULT_TTL,
      body,
      url,
    };
    const encodedMessage: Uint8Array = encodeNetworkRequest(request);
    // make request
    const connectionResponse: ConnectionResponse = await connection.request(
      connectionItem.connectionId,
      SEND_RECEIVE_CHANNEL,
      encodedMessage
    );

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.body) {
      throw new Error(`Result doesn't contains the body`);
    }

    const response: NetworkResponse = decodeNetworkResponse(connectionResponse.body);

    return {
      ...response,
      connectionMessage: omitObj(
        connectionResponse,
        'body',
        'error'
      ) as ConnectionMessage,
    };
  }

  // TODO: может лучше слушать определенный канал?
  onRequest(handler: NetworkOnRequestHandler): number {
    // TODO: нужно всетаки сделать обертку в которой выполнить хэндлер и сформировать ответ
    const cbWrapper = (request: NetworkRequest): void => {
      try {
        handler(request)
          .then((response: NetworkResponse) => this.sendResponseBack(response))
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
    // TODO: see network config and find connection which has the same hostId
  }

  private async sendResponseBack(response: NetworkResponse) {
    const connection: Connection = await this.resolveConnection(response.hostId);
    // TODO: resolve it !!!!!
    const sessionId = '1';

    // TODO:  может использовать такой метов в connection.sendResponseBack()
    const result: ConnectionResponse = await connection.request(
      sessionId,
      response.channel,
      // TODO: в случае ошибки отправить error
      response.body,
    );
  }

  private handleIncomeMessage = (sessionId: string, data: Uint8Array) => {

  }

}
