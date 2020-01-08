import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import Context from 'system/Context';
import NetworkDriver, {NetworkResponse, NetworkStatus} from 'system/interfaces/NetworkDriver';
import IndexedEvents from 'system/lib/IndexedEvents';
import NetworkMessage, {MessageType} from './interfaces/NetworkMessage';
import {serializeMessage} from './helpers';
import {NETWORK_PORT} from './Network';


type MessageHandler = (message: NetworkMessage) => void;


export default class Router {
  private readonly context: Context;
  private incomeMessagesEvents = new IndexedEvents<MessageHandler>();
  // driver instances by index of props.interfaces
  private connections: NetworkDriver[] = [];


  constructor(context: Context) {
    this.context = context;
  }


  init() {
    // TODO: инициализируем соединения
    // TODO: навешать this.handleIncomeData
    // TODO: сделать ответную сторрону для network drivers
  }

  destroy() {
    // TODO: add
  }


  async send(hostId: string, messageType: MessageType.remoteCall, payload: RemoteCallMessage): Promise<void> {
    // TODO: создать message
    // TODO: сериализовать

    const message: NetworkMessage = {
      to: hostId,
      from: this.context.id,
      messageType,
      payload
    };
    const data: Uint8Array = serializeMessage(message);
    const connection: NetworkDriver = this.resolveConnection(hostId);

    const result: NetworkResponse = await connection.request(NETWORK_PORT, data);

    if (result.status === NetworkStatus.errorMessage) {
      // TODO: где будет обработка error ?????
      this.context.log.error(result.error);
    }
  }

  /**
   * Listen only message which destination is current host or host hasn't been specified.
   */
  onIncomeDestMessage(cb: MessageHandler): number {
    return this.incomeMessagesEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.incomeMessagesEvents.removeListener(handlerIndex);
  }


  private handleIncomeData() {
    // TODO: add
    // TODO: десериализовать
    // TODO: сформировать сообщение
  }

  private resolveConnection(hostId: string): NetworkDriver {
    // TODO: add
  }

}
