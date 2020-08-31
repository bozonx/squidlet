import ServiceBase from 'system/base/ServiceBase';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionServiceType,
  ConnectionsEvents,
  IncomeMessageHandler,
  PeerStatusHandler
} from 'system/interfaces/Connection';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


interface Props extends WsServerSessionsProps {
}


export default class WsServerConnection extends ServiceBase<Props> implements Connection {
  serviceType: ConnectionServiceType = CONNECTION_SERVICE_TYPE;

  private events = new IndexedEventEmitter();
  // TODO: review как используются сессии, может лучше обычный сервер использовать
  server!: WsServerSessions;

  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage(this.handleIncomeMessage);
    // TODO: add !!!!
    // this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
    // });
    // this.server.onSessionClose((sessionId: string) => {
    // });
  }


  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 255.
   */
  async send(peerId: string, port: number, payload: Uint8Array): Promise<void> {
    await this.server.send(peerId, new Uint8Array([port, ...payload]));
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    return this.events.addListener(ConnectionsEvents.message, cb);
  }

  onPeerConnect(cb: PeerStatusHandler): number {
    return this.events.addListener(ConnectionsEvents.connected, cb);
  }

  onPeerDisconnect(cb: PeerStatusHandler): number {
    return this.events.addListener(ConnectionsEvents.disconnected, cb);
  }

  /**
   * Remove listener of onIncomeData, onPeerConnect or onPeerDisconnect
   */
  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  private handleIncomeMessage = (peerId: string, data: string | Uint8Array) => {
    if (!(data instanceof Uint8Array) || !data.length) return;

    const [port, ...rest] = data;
    const payload = new Uint8Array(rest);

    this.events.emit(ConnectionsEvents.message, peerId, port, payload);
  }

}
