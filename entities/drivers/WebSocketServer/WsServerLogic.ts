import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';


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

  // TODO: add startListenning promise

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

    this.wsServerIo.onConnection(this.serverId, this.handleIncomeConnection);
    this.wsServerIo.onListening(this.serverId, this.handleListenning);
    this.wsServerIo.onClose(this.serverId, this.onClose);
    this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(err));
  }


  private handleIncomeConnection = (clientId: string, connectionParams: ConnectionParams) => {

  }

  private handleListenning = () => {

  }

  private onClose = () => {

  }

}
