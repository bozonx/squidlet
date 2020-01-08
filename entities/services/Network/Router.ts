import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import NetworkMessage, {MessageType} from './interfaces/NetworkMessage';
import Connections from './Connections';


export default class Router {
  private readonly connections: Connections;


  constructor(connections: Connections) {
    this.connections = connections;
  }


  init() {
    // TODO: слушаем все доступные соединения
  }

  destroy() {
    // TODO: add
  }


  send(hostId: string, messageType: MessageType.remoteCall, payload: RemoteCallMessage): Promise<void> {
    // TODO: add
  }

  /**
   * Listen only message which destination is current host or host hasn't been specified.
   */
  onIncomeDestMessage(cb: (message: NetworkMessage) => void) {
    // TODO: add
  }

  // handleIncome(message: NetworkMessage) {
  //
  // }

}
