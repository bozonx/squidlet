import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';


// TODO: extend of driver's props
export interface WsServerLogicProps {
  host: string;
  port: number;
}


export default class WsServerLogic {
  private readonly wsServerIo: WebSocketServerIo;
  private readonly props: WsServerLogicProps;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private readonly serverId: string;

  // TODO: add startListening promise

  constructor(
    wsServerIo: WebSocketServerIo,
    props: WsServerLogicProps,
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo;
    this.props = props;
    this.onClose = onClose;
    this.logInfo = logInfo;
    this.logError = logError;

    this.serverId = this.wsServerIo.newServer({
      host: this.props.host,
      port: this.props.port,
    });

    this.listenServer();
  }

  destroy() {
    // clearTimeout(this.reconnectTimeout);
    // this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
    // TODO: !!!!
  }

  /**
   * Send message to client
   */
  send(connectionId: string, data: string | Uint8Array): Promise<void> {
    return this.wsServerIo.send(this.serverId, connectionId, data);
  }

  /**
   * Force closing a connection
   */
  close(connectionId: string, code: number, reason: string) {
    this.wsServerIo.close(this.serverId, connectionId, code, reason);
  }

  /**
   * Listen income messages
   */
  onMessage(connectionId: string, cb: OnMessageHandler): number {
    return this.wsServerIo.onMessage(this.serverId, connectionId, cb);
  }

  /**
   * It rises when new connection is come.
   */
  onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    return this.wsServerIo.onConnection(this.serverId, cb);
  }

  removeMessageListener(connectionId: string, handlerId: number) {
    this.wsServerIo.removeEventListener(this.serverId, connectionId,'message', handlerId);
  }

  removeConnectionListener(handlerId: number) {
    this.wsServerIo.removeServerEventListener(this.serverId, 'connection', handlerId);
  }


  private listenServer() {
    this.wsServerIo.onConnection(this.serverId, this.onIncomeConnection);
    this.wsServerIo.onServerListening(this.serverId, this.onServerListening);
    this.wsServerIo.onServerClose(this.serverId, this.onServerClose);
    this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  }

  private onIncomeConnection = (connectionId: string, connectionParams: ConnectionParams) => {
    this.wsServerIo.onClose(this.serverId, connectionId, () => this.onConnectionClose(connectionId));
    this.wsServerIo.onError(this.serverId, connectionId, (err: Error) => this.logError(String(err)));
  }

  private onServerListening = () => {
    // TODO: fulfill listening promise
  }

  private onServerClose = () => {
    this.onClose();
  }

  private onConnectionClose = (connectionId: string) => {
    this.logInfo(`WsServerLogic: connection closed. Client id: ${connectionId}. Server id: ${this.serverId}`);
  }

}
