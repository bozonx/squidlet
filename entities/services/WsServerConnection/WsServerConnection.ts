import ConnectionBase from 'system/lib/base/ConnectionBase';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


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
    // this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
    // });
    // this.server.onSessionClose((sessionId: string) => {
    // });
  }

  protected write(sessionId: string, data: Uint8Array): Promise<void> {
    return this.server.send(sessionId, data);
  }

}
