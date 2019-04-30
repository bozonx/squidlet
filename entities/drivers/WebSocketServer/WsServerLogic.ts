import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {IncomeDataHandler} from '../WebSocketClient/WsClientLogic';


// TODO: extend of driver's props
export interface WsServerLogicProps {
  host: string;
  port: number;
}


export default class WsServerLogic {
  private readonly wsServerIo: WebSocketServerIo;
  private readonly props: WsServerLogicProps;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private readonly serverId: string;

  // TODO: add startListening promise

  constructor(
    wsServerIo: WebSocketServerIo,
    props: WsServerLogicProps,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo;
    this.props = props;
    this.logInfo = logInfo;
    this.logError = logError;

    this.serverId = this.wsServerIo.newServer({
      host: this.props.host,
      port: this.props.port,
    });

    this.wsServerIo.onConnection(this.serverId, this.onIncomeConnection);
    this.wsServerIo.onServerListening(this.serverId, this.onServerListening);
    this.wsServerIo.onServerClose(this.serverId, this.onServerClose);
    this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  }

  destroy() {
    // clearTimeout(this.reconnectTimeout);
    // this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
  }

  send(clientId: string, data: string | Uint8Array) {
    this.wsServerIo.send(this.serverId, clientId, data);
  }

  onMessage(clientId: string, cb: IncomeDataHandler): number {
    return this.wsServerIo.onMessage(this.serverId, clientId, cb);
  }

  removeMessageListener(clientId: string, handlerId: number) {
    this.wsServerIo.removeEventListener(this.serverId, clientId,'message', handlerId);
  }


  private onIncomeConnection = (clientId: string, connectionParams: ConnectionParams) => {
    this.wsServerIo.onClose(this.serverId, clientId, this.onClose);
    this.wsServerIo.onMessage(this.serverId, clientId, this.onMessage);
    this.wsServerIo.onError(this.serverId, clientId, (err: Error) => this.logError(String(err)));
  }

  private onServerListening = () => {
    // TODO: fulfill listening promise
  }

  private onServerClose = () => {
    // TODO: what to do???
  }

  private onClose = () => {
    // TODO: what to do???
  }

  private onMessage = (data: string | Uint8Array) => {
    // TODO: what to do???
  }

}
