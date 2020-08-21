import Connection, {
  ConnectionOnRequestHandler,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import ConnectionBase from 'system/lib/base/ConnectionBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import ServiceBase from 'system/base/ServiceBase';
import {
  makeConnectionRequest,
  encodeRequest,
  encodeResponse,
  decodeIncomeMessage,
  isRequest
} from 'system/lib/connectionHelpers';
import Promised from 'system/lib/Promised';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


type Timeout = NodeJS.Timeout;


interface Props extends WsServerSessionsProps {
}


export default class WsServerConnection extends ConnectionBase<Props> {
  server!: WsServerSessions;



  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage((sessionId: string, data: string | Uint8Array) => {
      if (!(data instanceof Uint8Array) || !data.length) return;

      this.handleIncomeMessage(sessionId, data);
    });
    this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
      // TODO: add
    });
    this.server.onSessionClose((sessionId: string) => {
      // TODO: add
    });
  }

  protected write(sessionId: string, data: Uint8Array): Promise<void> {
    return this.server.send(sessionId, data);
  }


}
