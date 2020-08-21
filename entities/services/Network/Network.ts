import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import Router from './Router';
import Connection, {ConnectionResponse, ConnectionStatus} from '../../../system/interfaces/Connection';
import {encodeRequest} from '../../../system/lib/connectionHelpers';
import IndexedEvents from '../../../system/lib/IndexedEvents';


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
  channel: number;
}

export interface NetworkResponse extends NetworkMessage {
  // TODO: does it really need?
  requestId: number;
  status: ConnectionStatus;
  body?: Uint8Array;
  error?: string;
}

export interface NetworkRequest extends NetworkMessage {
  body: Uint8Array;
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


export default class Network extends ServiceBase<NetworkProps> {
  private incomeRequestsEvent = new IndexedEvents<IncomeRequestsHandler>();

  //private readonly router: Router;
  // link between { sessionId: [ hostId, networkDriverNum, busId ] }
  //private sessionLinks: {[index: string]: AddressDefinition} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    //this.router = new Router(this.context, this.props);
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


  async request(hostId: string, channel: number, data: Uint8Array): Promise<NetworkResponse> {
    const connection: Connection = await this.resolveConnection(hostId);
    // TODO: resolve it !!!!!
    const sessionId = '1';

    // TODO: нужно закодировать сообщение с to, from
    // TODO: нужно передать status ???

    const result: ConnectionResponse = await connection.request(sessionId, channel, data);

    return {
      to: hostId,
      // TODO: см в раскодированном ответе
      from: this.context.config.id,
      channel,
      status: result.status,
      requestId: result.requestId,
      body: result.body,
      error: result.error,
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


  private resolveConnection(hostId: string): Promise<Connection> {
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
